import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
import { TicketStatus } from '../../common/database/ticket-status.enum';
import { InfraHubApiService } from '../infra-hub-api/infra-hub-api.service';
import { DatabaseManagementTicketMapper } from '../create-ticket/mapper/database-management-ticket.mapper';
import { DatabaseProvisioningTicketMapper } from '../create-ticket/mapper/database-provisioning-ticket.mapper';
import { ServerManagementTicketMapper } from '../create-ticket/mapper/server-management-ticket.mapper';
import { KubernetesManifestTicketMapper } from '../create-ticket/mapper/kubernetes-manifest-ticket.mapper';
import { KubectlCommandTicketMapper } from '../create-ticket/mapper/kubectl-command-ticket.mapper';

@Injectable()
export class UpdateTicketService {
  constructor(
    private readonly databaseManagementTicketsRepository: DatabaseManagementTicketsRepository,
    private readonly databaseProvisioningTicketsRepository: DatabaseProvisioningTicketsRepository,
    private readonly serverManagementTicketsRepository: ServerManagementTicketsRepository,
    private readonly kubernetesManifestTicketsRepository: KubernetesManifestTicketsRepository,
    private readonly kubectlCommandTicketsRepository: KubectlCommandTicketsRepository,
    private readonly infraHubApiService: InfraHubApiService,
  ) {}

  async approveDatabaseManagementTicket(
    number: number,
  ): Promise<DatabaseManagementTicketEntity> {
    const ticket =
      await this.databaseManagementTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Database management ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    const { executionResult } = await this.infraHubApiService.manageDatabase(
      DatabaseManagementTicketMapper.toManageDatabaseRequest(ticket),
    );

    ticket.status = TicketStatus.APPROVED;
    ticket.response = JSON.stringify(executionResult);
    return this.databaseManagementTicketsRepository.create(ticket);
  }

  async approveDatabaseProvisioningTicket(
    number: number,
  ): Promise<DatabaseProvisioningTicketEntity> {
    const ticket =
      await this.databaseProvisioningTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Database provisioning ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    const { executionResult } = await this.infraHubApiService.createDatabase(
      DatabaseProvisioningTicketMapper.toCreateDatabaseRequest(ticket),
    );

    ticket.status = TicketStatus.APPROVED;
    ticket.response = JSON.stringify(executionResult);
    return this.databaseProvisioningTicketsRepository.create(ticket);
  }

  async approveServerManagementTicket(
    number: number,
  ): Promise<ServerManagementTicketEntity> {
    const ticket =
      await this.serverManagementTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Server management ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    const { executionResult } =
      await this.infraHubApiService.manageServerCommand(
        ServerManagementTicketMapper.toManageServerCommandRequest(ticket),
      );

    ticket.status = TicketStatus.APPROVED;
    ticket.response = JSON.stringify(executionResult);
    return this.serverManagementTicketsRepository.create(ticket);
  }

  async approveKubernetesManifestTicket(
    number: number,
  ): Promise<KubernetesManifestTicketEntity> {
    const ticket =
      await this.kubernetesManifestTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubernetes manifest ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    const { executionResult } =
      await this.infraHubApiService.manageKubernetesManifest(
        KubernetesManifestTicketMapper.toManageKubernetesManifestRequest(
          ticket,
        ),
      );

    ticket.status = TicketStatus.APPROVED;
    ticket.response = JSON.stringify(executionResult);
    return this.kubernetesManifestTicketsRepository.create(ticket);
  }

  async approveKubectlCommandTicket(
    number: number,
  ): Promise<KubectlCommandTicketEntity> {
    const ticket =
      await this.kubectlCommandTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubectl command ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    const { executionResult } =
      await this.infraHubApiService.executeKubectlCommand(
        KubectlCommandTicketMapper.toExecuteKubectlCommandRequest(ticket),
      );

    ticket.status = TicketStatus.APPROVED;
    ticket.response = JSON.stringify(executionResult);
    return this.kubectlCommandTicketsRepository.create(ticket);
  }

  async rejectDatabaseManagementTicket(
    number: number,
  ): Promise<DatabaseManagementTicketEntity> {
    const ticket =
      await this.databaseManagementTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Database management ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.databaseManagementTicketsRepository.create(ticket);
  }

  async rejectDatabaseProvisioningTicket(
    number: number,
  ): Promise<DatabaseProvisioningTicketEntity> {
    const ticket =
      await this.databaseProvisioningTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Database provisioning ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.databaseProvisioningTicketsRepository.create(ticket);
  }

  async rejectServerManagementTicket(
    number: number,
  ): Promise<ServerManagementTicketEntity> {
    const ticket =
      await this.serverManagementTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Server management ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.serverManagementTicketsRepository.create(ticket);
  }

  async rejectKubernetesManifestTicket(
    number: number,
  ): Promise<KubernetesManifestTicketEntity> {
    const ticket =
      await this.kubernetesManifestTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubernetes manifest ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.kubernetesManifestTicketsRepository.create(ticket);
  }

  async rejectKubectlCommandTicket(
    number: number,
  ): Promise<KubectlCommandTicketEntity> {
    const ticket =
      await this.kubectlCommandTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubectl command ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.kubectlCommandTicketsRepository.create(ticket);
  }

  private assertOpen(
    status: TicketStatus,
    number: number,
    action: 'approved' | 'rejected',
  ): void {
    if (status !== TicketStatus.OPEN) {
      throw new ConflictException(
        `Ticket with number ${number} is already ${status}, it cannot be ${action}`,
      );
    }
  }
}
