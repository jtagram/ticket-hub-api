import {
  Global,
  INestApplication,
  Module,
  Type,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';
import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { DatabaseManagementTicketEntity } from '../../src/common/database/database-management-ticket/database-management-ticket.entity';
import { DatabaseManagementTicketsRepository } from '../../src/common/database/database-management-ticket/database-management-tickets.repository';
import { DatabaseProvisioningTicketEntity } from '../../src/common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { DatabaseProvisioningTicketsRepository } from '../../src/common/database/database-provisioning-ticket/database-provisioning-tickets.repository';
import { KubectlCommandTicketEntity } from '../../src/common/database/kubectl-command-ticket/kubectl-command-ticket.entity';
import { KubectlCommandTicketsRepository } from '../../src/common/database/kubectl-command-ticket/kubectl-command-tickets.repository';
import { KubernetesManifestTicketEntity } from '../../src/common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { KubernetesManifestTicketsRepository } from '../../src/common/database/kubernetes-manifest-ticket/kubernetes-manifest-tickets.repository';
import { ServerManagementTicketEntity } from '../../src/common/database/server-management-ticket/server-management-ticket.entity';
import { ServerManagementTicketsRepository } from '../../src/common/database/server-management-ticket/server-management-tickets.repository';
import { FilterModule } from '../../src/common/filter/filter.module';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/common/guards/roles.guard';
import { JwtPublicKeyService } from '../../src/common/jwt/jwt-public-key.service';
import { createInMemoryDataSource } from './in-memory-db';
import { publicKeyServiceStub, TEST_APPLICATION_NAME } from './test-auth';

type TicketEntity = Parameters<typeof getRepositoryToken>[0] &
  EntityTarget<ObjectLiteral>;

const TICKET_ENTITIES: TicketEntity[] = [
  ServerManagementTicketEntity,
  DatabaseManagementTicketEntity,
  DatabaseProvisioningTicketEntity,
  KubernetesManifestTicketEntity,
  KubectlCommandTicketEntity,
];

const TICKET_REPOSITORIES = [
  ServerManagementTicketsRepository,
  DatabaseManagementTicketsRepository,
  DatabaseProvisioningTicketsRepository,
  KubernetesManifestTicketsRepository,
  KubectlCommandTicketsRepository,
];

export interface ProviderOverride {
  /** Injection token (usually the class) of the provider to replace. */
  provide: unknown;
  useValue: unknown;
}

export interface TicketTestAppOptions {
  /** Feature modules under test, wired exactly as AppModule imports them. */
  modules: Type<unknown>[];
  /** Providers replaced by fakes (the outbound HTTP edges of the module). */
  overrides?: ProviderOverride[];
}

export interface TicketTestApp {
  app: INestApplication;
  dataSource: DataSource;
  /**
   * Empties every ticket table. pg-mem's `clear()` only deletes the rows: it
   * does NOT restart the `id`/`number` sequences, so the first ticket of a test
   * gets whatever number follows the previous tests. Never assume numbers start
   * at 1: use the number of the seeded/created ticket.
   */
  resetTables: () => Promise<void>;
  close: () => Promise<void>;
}

/**
 * Boots the given feature modules the way AppModule wires them (real
 * controllers, services, repositories, guards, filters and ValidationPipe) on
 * top of an in-memory Postgres. Only the infrastructure edges are replaced:
 * the TypeORM connection (pg-mem), the env validation (inline ConfigModule),
 * the JWKS fetch of JwtPublicKeyService (a stub serving the test public key)
 * and whatever `overrides` the caller passes (outbound HTTP connectors).
 */
export async function createTicketTestApp(
  options: TicketTestAppOptions,
): Promise<TicketTestApp> {
  const dataSource = await createInMemoryDataSource(TICKET_ENTITIES);

  // Stand-in for the global DatabaseModule: same repositories, pg-mem behind them.
  @Global()
  @Module({
    providers: [
      ...TICKET_ENTITIES.map((entity) => ({
        provide: getRepositoryToken(entity),
        useValue: dataSource.getRepository(entity),
      })),
      ...TICKET_REPOSITORIES,
    ],
    exports: TICKET_REPOSITORIES,
  })
  class InMemoryDatabaseModule {}

  @Module({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
        load: [
          () => ({ TICKET_HUB_API_APPLICATION_NAME: TEST_APPLICATION_NAME }),
        ],
      }),
      LoggerModule.forRoot({ pinoHttp: { level: 'silent' } }),
      JwtModule.register({}),
      InMemoryDatabaseModule,
      FilterModule,
      ...options.modules,
    ],
    providers: [
      { provide: JwtPublicKeyService, useValue: publicKeyServiceStub },
      { provide: APP_GUARD, useClass: JwtAuthGuard },
      { provide: APP_GUARD, useClass: RolesGuard },
    ],
  })
  class TicketTestModule {}

  let builder = Test.createTestingModule({ imports: [TicketTestModule] });
  for (const override of options.overrides ?? []) {
    builder = builder
      .overrideProvider(override.provide)
      .useValue(override.useValue);
  }
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication();
  // Same options as src/main.ts.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  await app.init();

  return {
    app,
    dataSource,
    resetTables: async () => {
      for (const entity of TICKET_ENTITIES) {
        await dataSource.getRepository(entity).clear();
      }
    },
    close: async () => {
      await app.close();
      await dataSource.destroy();
    },
  };
}
