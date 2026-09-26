import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatacenterTicketEntity } from './datacenter-ticket/datacenter-ticket.entity';
import { DatacenterTicketsRepository } from './datacenter-ticket/datacenter-tickets.repository';
import { DatabaseManagementTicketEntity } from './database-management-ticket/database-management-ticket.entity';
import { DatabaseManagementTicketsRepository } from './database-management-ticket/database-management-tickets.repository';
import { DatabaseProvisioningTicketEntity } from './database-provisioning-ticket/database-provisioning-ticket.entity';
import { DatabaseProvisioningTicketsRepository } from './database-provisioning-ticket/database-provisioning-tickets.repository';
import { KubernetesManifestTicketEntity } from './kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { KubernetesManifestTicketsRepository } from './kubernetes-manifest-ticket/kubernetes-manifest-tickets.repository';
import { KubernetesCommandTicketEntity } from './kubernetes-command-ticket/kubernetes-command-ticket.entity';
import { KubernetesCommandTicketsRepository } from './kubernetes-command-ticket/kubernetes-command-tickets.repository';

const entities = [
  DatacenterTicketEntity,
  DatabaseManagementTicketEntity,
  DatabaseProvisioningTicketEntity,
  KubernetesManifestTicketEntity,
  KubernetesCommandTicketEntity,
];

const repositories = [
  DatacenterTicketsRepository,
  DatabaseManagementTicketsRepository,
  DatabaseProvisioningTicketsRepository,
  KubernetesManifestTicketsRepository,
  KubernetesCommandTicketsRepository,
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: Number(configService.get<string>('DATABASE_PORT')),
        username: configService.get<string>('POSTGRES_USER'),
        password: configService.get<string>('POSTGRES_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities,
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: repositories,
  exports: repositories,
})
export class DatabaseModule {}
