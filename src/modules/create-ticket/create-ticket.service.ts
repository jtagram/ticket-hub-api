import { Injectable } from '@nestjs/common';
import { DatabaseManagementTicketEntity } from '../../common/database/database-management-ticket/database-management-ticket.entity';
import { DatabaseManagementTicketsRepository } from '../../common/database/database-management-ticket/database-management-tickets.repository';
import { DatabaseProvisioningTicketEntity } from '../../common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { DatabaseProvisioningTicketsRepository } from '../../common/database/database-provisioning-ticket/database-provisioning-tickets.repository';
import { ServerManagementTicketEntity } from '../../common/database/server-management-ticket/server-management-ticket.entity';
import { ServerManagementTicketsRepository } from '../../common/database/server-management-ticket/server-management-tickets.repository';
import { KubernetesManifestTicketEntity } from '../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { KubernetesManifestTicketsRepository } from '../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-tickets.repository';
import { KubectlCommandTicketEntity } from '../../common/database/kubectl-command-ticket/kubectl-command-ticket.entity';
import { KubectlCommandTicketsRepository } from '../../common/database/kubectl-command-ticket/kubectl-command-tickets.repository';
import { CreateDatabaseManagementTicketDto } from './dto/create-database-management-ticket.dto';
import { CreateDatabaseProvisioningTicketDto } from './dto/create-database-provisioning-ticket.dto';
import { CreateServerManagementTicketDto } from './dto/create-server-management-ticket.dto';
import { CreateKubernetesManifestTicketDto } from './dto/create-kubernetes-manifest-ticket.dto';
import { CreateKubectlCommandTicketDto } from './dto/create-kubectl-command-ticket.dto';
import { DatabaseManagementTicketMapper } from './mapper/database-management-ticket.mapper';
import { DatabaseProvisioningTicketMapper } from './mapper/database-provisioning-ticket.mapper';
import { ServerManagementTicketMapper } from './mapper/server-management-ticket.mapper';
import { KubernetesManifestTicketMapper } from './mapper/kubernetes-manifest-ticket.mapper';
import { KubectlCommandTicketMapper } from './mapper/kubectl-command-ticket.mapper';

@Injectable()
export class CreateTicketService {
  constructor(
    private readonly databaseManagementTicketsRepository: DatabaseManagementTicketsRepository,
    private readonly databaseProvisioningTicketsRepository: DatabaseProvisioningTicketsRepository,
    private readonly serverManagementTicketsRepository: ServerManagementTicketsRepository,
    private readonly kubernetesManifestTicketsRepository: KubernetesManifestTicketsRepository,
    private readonly kubectlCommandTicketsRepository: KubectlCommandTicketsRepository,
  ) {}

  async createDatabaseManagementTicket(
    dto: CreateDatabaseManagementTicketDto,
  ): Promise<DatabaseManagementTicketEntity> {
    const ticket = DatabaseManagementTicketMapper.toEntity(dto);
    return this.databaseManagementTicketsRepository.create(ticket);
  }

  async createDatabaseProvisioningTicket(
    dto: CreateDatabaseProvisioningTicketDto,
  ): Promise<DatabaseProvisioningTicketEntity> {
    const ticket = DatabaseProvisioningTicketMapper.toEntity(dto);
    return this.databaseProvisioningTicketsRepository.create(ticket);
  }

  async createServerManagementTicket(
    dto: CreateServerManagementTicketDto,
  ): Promise<ServerManagementTicketEntity> {
    const ticket = ServerManagementTicketMapper.toEntity(dto);
    return this.serverManagementTicketsRepository.create(ticket);
  }

  async createKubernetesManifestTicket(
    dto: CreateKubernetesManifestTicketDto,
  ): Promise<KubernetesManifestTicketEntity> {
    const ticket = KubernetesManifestTicketMapper.toEntity(dto);
    return this.kubernetesManifestTicketsRepository.create(ticket);
  }

  async createKubectlCommandTicket(
    dto: CreateKubectlCommandTicketDto,
  ): Promise<KubectlCommandTicketEntity> {
    const ticket = KubectlCommandTicketMapper.toEntity(dto);
    return this.kubectlCommandTicketsRepository.create(ticket);
  }
}
