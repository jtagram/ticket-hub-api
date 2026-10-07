import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { jest } from '@jest/globals';
import { createPublicKey } from 'node:crypto';
import { DataSource } from 'typeorm';
import { DatabaseManagementTicketEntity } from '../../src/common/database/database-management-ticket/database-management-ticket.entity';
import { DatabaseProvisioningTicketEntity } from '../../src/common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { KubectlCommandTicketEntity } from '../../src/common/database/kubectl-command-ticket/kubectl-command-ticket.entity';
import { KubernetesManifestTicketEntity } from '../../src/common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { ServerManagementTicketEntity } from '../../src/common/database/server-management-ticket/server-management-ticket.entity';
import { IamApiConnector } from '../../src/modules/iam-api/iam-api.connector';
import { InfraHubApiConnector } from '../../src/modules/infra-hub-api/infra-hub-api.connector';
import { createInMemoryDataSource } from './in-memory-db';
import {
  createIamConnectorFake,
  createInfraHubConnectorFake,
} from './outbound-fakes';
import {
  publicKeyServiceStub,
  TEST_APPLICATION_NAME,
  TEST_KEY_ID,
} from './test-auth';

const IAM_API_URL = 'http://iam-api.test';

const ENTITIES = [
  ServerManagementTicketEntity,
  DatabaseManagementTicketEntity,
  DatabaseProvisioningTicketEntity,
  KubernetesManifestTicketEntity,
  KubectlCommandTicketEntity,
];

/** Valid values for every variable validated by src/common/config/env.validation.ts. */
const TEST_ENV: Record<string, string> = {
  PORT: '0',
  // 'silent' is not accepted by the env validation; 'fatal' is quiet enough.
  LOG_LEVEL: 'fatal',
  POSTGRES_USER: 'test',
  POSTGRES_PASSWORD: 'test',
  DATABASE_HOST: 'unused-pg-mem',
  DATABASE_PORT: '5432',
  DATABASE_NAME: 'test',
  INFRA_HUB_API_URL: 'http://infra-hub-api.test',
  IAM_API_URL,
  TICKET_HUB_API_APPLICATION_NAME: TEST_APPLICATION_NAME,
  IAM_API_APPLICATION_NAME: 'iam-api-test',
  INFRA_HUB_API_APPLICATION_NAME: 'infra-hub-api-test',
  TICKET_HUB_API_SERVICE_CLIENT_ID: 'client-id',
  TICKET_HUB_API_SERVICE_CLIENT_SECRET: 'client-secret',
};

export interface AppTestApp {
  app: INestApplication;
  dataSource: DataSource;
  iam: ReturnType<typeof createIamConnectorFake>;
  infraHub: ReturnType<typeof createInfraHubConnectorFake>;
  resetTables: () => Promise<void>;
  close: () => Promise<void>;
}

/**
 * Boots the REAL AppModule (EnvModule with validation, pino logger,
 * ScheduleModule, DatabaseModule/TypeOrmModule, JwtPublicKeyService, all
 * feature modules, APP_GUARD JwtAuthGuard + RolesGuard, filters).
 *
 * Replaced edges only:
 *  - the TypeORM DataSource provider -> pg-mem (the forRootAsync factory still
 *    runs with the test env, but nothing connects to Postgres);
 *  - global `fetch` for `${IAM_API_URL}/.well-known/jwks.json` -> JWKS built
 *    from the test public key (any other URL is rejected);
 *  - InfraHubApiConnector and IamApiConnector -> fakes.
 * process.env is set for the boot and restored on close().
 */
export async function createAppTestApp(): Promise<AppTestApp> {
  const previousEnv: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(TEST_ENV)) {
    previousEnv[key] = process.env[key];
    process.env[key] = value;
  }

  const publicKeyPem = (await publicKeyServiceStub.getPublicKey(TEST_KEY_ID))!;
  const jwk = createPublicKey(publicKeyPem).export({ format: 'jwk' });
  const fetchSpy = jest
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : String(input);
      if (url === `${IAM_API_URL}/.well-known/jwks.json`) {
        return new Response(
          JSON.stringify({ keys: [{ ...jwk, kid: TEST_KEY_ID }] }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      throw new Error(`Unexpected outbound HTTP call in e2e: ${url}`);
    });

  const dataSource = await createInMemoryDataSource(ENTITIES);
  const iam = createIamConnectorFake();
  const infraHub = createInfraHubConnectorFake();

  const restore = () => {
    fetchSpy.mockRestore();
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };

  try {
    // Imported lazily: EnvModule calls ConfigModule.forRoot({ validate }) while
    // the module file is evaluated, so the env must already be set by then.
    // The specifier is a variable so tsc (nodenext) does not demand a file
    // extension; ts-jest/ESM resolves it at runtime.
    const appModulePath = '../../src/app.module';
    const { AppModule } = (await import(
      appModulePath
    )) as typeof import('../../src/app.module');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .overrideProvider(InfraHubApiConnector)
      .useValue(infraHub)
      .overrideProvider(IamApiConnector)
      .useValue(iam)
      .compile();

    const app = moduleRef.createNestApplication({ logger: false });
    // Same options as the global pipe configured in src/main.ts (outside AppModule).
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    return {
      app,
      dataSource,
      iam,
      infraHub,
      resetTables: async () => {
        for (const entity of ENTITIES) {
          await dataSource.getRepository(entity).clear();
        }
      },
      close: async () => {
        await app.close();
        if (dataSource.isInitialized) {
          await dataSource.destroy();
        }
        restore();
      },
    };
  } catch (error) {
    restore();
    throw error;
  }
}
