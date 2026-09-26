import { Injectable } from '@nestjs/common';
import { DatabaseTicketEntity } from '../../common/database/database-ticket/database-ticket.entity';
import { DatabaseTicketsRepository } from '../../common/database/database-ticket/database-tickets.repository';
import { DatabaseProvisioningTicketEntity } from '../../common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { DatabaseProvisioningTicketsRepository } from '../../common/database/database-provisioning-ticket/database-provisioning-tickets.repository';
import { DatacenterTicketEntity } from '../../common/database/datacenter-ticket/datacenter-ticket.entity';
import { DatacenterTicketsRepository } from '../../common/database/datacenter-ticket/datacenter-tickets.repository';
import { KubernetesManifestTicketEntity } from '../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { KubernetesManifestTicketsRepository } from '../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-tickets.repository';
import { KubernetesCommandTicketEntity } from '../../common/database/kubernetes-command-ticket/kubernetes-command-ticket.entity';
import { KubernetesCommandTicketsRepository } from '../../common/database/kubernetes-command-ticket/kubernetes-command-tickets.repository';
import { CreateDatabaseTicketDto } from './dto/create-database-ticket.dto';
import { CreateDatabaseProvisioningTicketDto } from './dto/create-database-provisioning-ticket.dto';
import { CreateDatacenterTicketDto } from './dto/create-datacenter-ticket.dto';
import { CreateKubernetesManifestTicketDto } from './dto/create-kubernetes-manifest-ticket.dto';
import { CreateKubernetesCommandTicketDto } from './dto/create-kubernetes-command-ticket.dto';
import { DatabaseTicketMapper } from './mapper/database-ticket.mapper';
import { DatabaseProvisioningTicketMapper } from './mapper/database-provisioning-ticket.mapper';
import { DatacenterTicketMapper } from './mapper/datacenter-ticket.mapper';
import { KubernetesManifestTicketMapper } from './mapper/kubernetes-manifest-ticket.mapper';
import { KubernetesCommandTicketMapper } from './mapper/kubernetes-command-ticket.mapper';

@Injectable()
export class CreateTicketService {
  constructor(
    private readonly databaseTicketsRepository: DatabaseTicketsRepository,
    private readonly databaseProvisioningTicketsRepository: DatabaseProvisioningTicketsRepository,
    private readonly datacenterTicketsRepository: DatacenterTicketsRepository,
    private readonly kubernetesManifestTicketsRepository: KubernetesManifestTicketsRepository,
    private readonly kubernetesCommandTicketsRepository: KubernetesCommandTicketsRepository,
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
  ): Promise<KubernetesManifestTicketEntity> {
    const ticket = KubernetesManifestTicketMapper.toEntity(dto);
    return this.kubernetesManifestTicketsRepository.create(ticket);
  }

  async createKubernetesCommandTicket(
    dto: CreateKubernetesCommandTicketDto,
  ): Promise<KubernetesCommandTicketEntity> {
    const ticket = KubernetesCommandTicketMapper.toEntity(dto);
    return this.kubernetesCommandTicketsRepository.create(ticket);
  }
}
