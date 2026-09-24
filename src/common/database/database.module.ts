import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatacenterTicketEntity } from './datacenter-ticket/datacenter-ticket.entity';
import { DatacenterTicketsRepository } from './datacenter-ticket/datacenter-tickets.repository';
import { DatabaseTicketEntity } from './database-ticket/database-ticket.entity';
import { DatabaseTicketsRepository } from './database-ticket/database-tickets.repository';
import { KubernetesTicketEntity } from './kubernetes-ticket/kubernetes-ticket.entity';
import { KubernetesTicketsRepository } from './kubernetes-ticket/kubernetes-tickets.repository';

const entities = [
  DatacenterTicketEntity,
  DatabaseTicketEntity,
  KubernetesTicketEntity,
];

const repositories = [
  DatacenterTicketsRepository,
  DatabaseTicketsRepository,
  KubernetesTicketsRepository,
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
