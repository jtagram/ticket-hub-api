import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class SearchTicketService {
  constructor(
    private readonly databaseManagementTicketsRepository: DatabaseManagementTicketsRepository,
    private readonly databaseProvisioningTicketsRepository: DatabaseProvisioningTicketsRepository,
    private readonly serverManagementTicketsRepository: ServerManagementTicketsRepository,
    private readonly kubernetesManifestTicketsRepository: KubernetesManifestTicketsRepository,
    private readonly kubectlCommandTicketsRepository: KubectlCommandTicketsRepository,
  ) {}

  async findAllDatabaseManagementTickets(): Promise<
    DatabaseManagementTicketEntity[]
  > {
    return this.databaseManagementTicketsRepository.findAll();
  }

  async findAllDatabaseProvisioningTickets(): Promise<
    DatabaseProvisioningTicketEntity[]
  > {
    return this.databaseProvisioningTicketsRepository.findAll();
  }

  async findAllServerManagementTickets(): Promise<
    ServerManagementTicketEntity[]
  > {
    return this.serverManagementTicketsRepository.findAll();
  }

  async findAllKubernetesManifestTickets(): Promise<
    KubernetesManifestTicketEntity[]
  > {
    return this.kubernetesManifestTicketsRepository.findAll();
  }

  async findAllKubectlCommandTickets(): Promise<
    KubectlCommandTicketEntity[]
  > {
    return this.kubectlCommandTicketsRepository.findAll();
  }

  async findDatabaseManagementTicketByNumber(
    number: number,
  ): Promise<DatabaseManagementTicketEntity> {
    const ticket =
      await this.databaseManagementTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Database management ticket with number ${number} not found`,
      );
    }
    return ticket;
  }

  async findDatabaseProvisioningTicketByNumber(
    number: number,
  ): Promise<DatabaseProvisioningTicketEntity> {
    const ticket =
      await this.databaseProvisioningTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Database provisioning ticket with number ${number} not found`,
      );
    }
    return ticket;
  }

  async findServerManagementTicketByNumber(
    number: number,
  ): Promise<ServerManagementTicketEntity> {
    const ticket =
      await this.serverManagementTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Server management ticket with number ${number} not found`,
      );
    }
    return ticket;
  }

  async findKubernetesManifestTicketByNumber(
    number: number,
  ): Promise<KubernetesManifestTicketEntity> {
    const ticket =
      await this.kubernetesManifestTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubernetes manifest ticket with number ${number} not found`,
      );
    }
    return ticket;
  }

  async findKubectlCommandTicketByNumber(
    number: number,
  ): Promise<KubectlCommandTicketEntity> {
    const ticket =
      await this.kubectlCommandTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubectl command ticket with number ${number} not found`,
      );
    }
    return ticket;
  }
}
