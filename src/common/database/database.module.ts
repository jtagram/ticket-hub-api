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
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities,
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    TypeOrmModule.forFeature(entities),
  ],
  providers: repositories,
  exports: repositories,
})
export class DatabaseModule {}
