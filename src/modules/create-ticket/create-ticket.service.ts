import { Injectable } from '@nestjs/common';
import { DatabaseTicketEntity } from '../../common/database/database-ticket/database-ticket.entity';
import { DatabaseTicketsRepository } from '../../common/database/database-ticket/database-tickets.repository';
import { DatabaseProvisioningTicketEntity } from '../../common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { DatabaseProvisioningTicketsRepository } from '../../common/database/database-provisioning-ticket/database-provisioning-tickets.repository';
import { DatacenterTicketEntity } from '../../common/database/datacenter-ticket/datacenter-ticket.entity';
import { DatacenterTicketsRepository } from '../../common/database/datacenter-ticket/datacenter-tickets.repository';
import { KubernetesTicketEntity } from '../../common/database/kubernetes-ticket/kubernetes-ticket.entity';
import { KubernetesTicketsRepository } from '../../common/database/kubernetes-ticket/kubernetes-tickets.repository';
import { CreateDatabaseTicketDto } from './dto/create-database-ticket.dto';
import { CreateDatabaseProvisioningTicketDto } from './dto/create-database-provisioning-ticket.dto';
import { CreateDatacenterTicketDto } from './dto/create-datacenter-ticket.dto';
import { CreateKubernetesManifestTicketDto } from './dto/create-kubernetes-manifest-ticket.dto';
import { CreateKubernetesCommandTicketDto } from './dto/create-kubernetes-command-ticket.dto';
import { DatabaseTicketMapper } from './mapper/database-ticket.mapper';
import { DatabaseProvisioningTicketMapper } from './mapper/database-provisioning-ticket.mapper';
import { DatacenterTicketMapper } from './mapper/datacenter-ticket.mapper';
import { KubernetesTicketMapper } from './mapper/kubernetes-ticket.mapper';

@Injectable()
export class CreateTicketService {
  constructor(
    private readonly databaseTicketsRepository: DatabaseTicketsRepository,
    private readonly databaseProvisioningTicketsRepository: DatabaseProvisioningTicketsRepository,
    private readonly datacenterTicketsRepository: DatacenterTicketsRepository,
    private readonly kubernetesTicketsRepository: KubernetesTicketsRepository,
  ) {}

  async createDatabaseTicket(
    dto: CreateDatabaseTicketDto,
  ): Promise<DatabaseTicketEntity> {
    const ticket = DatabaseTicketMapper.toEntity(dto);
    return this.databaseTicketsRepository.create(ticket);
  }

  async createDatabaseProvisioningTicket(
    dto: CreateDatabaseProvisioningTicketDto,
  ): Promise<DatabaseProvisioningTicketEntity> {
    const ticket = DatabaseProvisioningTicketMapper.toEntity(dto);
    return this.databaseProvisioningTicketsRepository.create(ticket);
  }

  async createDatacenterTicket(
    dto: CreateDatacenterTicketDto,
  ): Promise<DatacenterTicketEntity> {
    const ticket = DatacenterTicketMapper.toEntity(dto);
    return this.datacenterTicketsRepository.create(ticket);
  }

  async createKubernetesManifestTicket(
    dto: CreateKubernetesManifestTicketDto,
  ): Promise<KubernetesTicketEntity> {
    const ticket = KubernetesTicketMapper.toManifestEntity(dto);
    return this.kubernetesTicketsRepository.create(ticket);
  }

  async createKubernetesCommandTicket(
    dto: CreateKubernetesCommandTicketDto,
  ): Promise<KubernetesTicketEntity> {
    const ticket = KubernetesTicketMapper.toCommandEntity(dto);
    return this.kubernetesTicketsRepository.create(ticket);
  }
}
