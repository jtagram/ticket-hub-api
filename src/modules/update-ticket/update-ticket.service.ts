import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseManagementTicketEntity } from '../../common/database/database-management-ticket/database-management-ticket.entity';
import { DatabaseManagementTicketsRepository } from '../../common/database/database-management-ticket/database-management-tickets.repository';
import { DatabaseProvisioningTicketEntity } from '../../common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { DatabaseProvisioningTicketsRepository } from '../../common/database/database-provisioning-ticket/database-provisioning-tickets.repository';
import { DatacenterTicketEntity } from '../../common/database/datacenter-ticket/datacenter-ticket.entity';
import { DatacenterTicketsRepository } from '../../common/database/datacenter-ticket/datacenter-tickets.repository';
import { KubernetesManifestTicketEntity } from '../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { KubernetesManifestTicketsRepository } from '../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-tickets.repository';
import { KubernetesCommandTicketEntity } from '../../common/database/kubernetes-command-ticket/kubernetes-command-ticket.entity';
import { KubernetesCommandTicketsRepository } from '../../common/database/kubernetes-command-ticket/kubernetes-command-tickets.repository';
import { TicketStatus } from '../../common/database/ticket-status.enum';
import { InfraHubApiService } from '../infra-hub-api/infra-hub-api.service';
import { DatabaseManagementTicketMapper } from '../create-ticket/mapper/database-management-ticket.mapper';
import { DatabaseProvisioningTicketMapper } from '../create-ticket/mapper/database-provisioning-ticket.mapper';
import { DatacenterTicketMapper } from '../create-ticket/mapper/datacenter-ticket.mapper';
import { KubernetesManifestTicketMapper } from '../create-ticket/mapper/kubernetes-manifest-ticket.mapper';
import { KubernetesCommandTicketMapper } from '../create-ticket/mapper/kubernetes-command-ticket.mapper';

@Injectable()
export class UpdateTicketService {
  constructor(
    private readonly databaseManagementTicketsRepository: DatabaseManagementTicketsRepository,
    private readonly databaseProvisioningTicketsRepository: DatabaseProvisioningTicketsRepository,
    private readonly datacenterTicketsRepository: DatacenterTicketsRepository,
    private readonly kubernetesManifestTicketsRepository: KubernetesManifestTicketsRepository,
    private readonly kubernetesCommandTicketsRepository: KubernetesCommandTicketsRepository,
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

  async approveDatacenterTicket(
    number: number,
  ): Promise<DatacenterTicketEntity> {
    const ticket =
      await this.datacenterTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Datacenter ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    const { executionResult } =
      await this.infraHubApiService.manageServerCommand(
        DatacenterTicketMapper.toManageServerCommandRequest(ticket),
      );

    ticket.status = TicketStatus.APPROVED;
    ticket.response = JSON.stringify(executionResult);
    return this.datacenterTicketsRepository.create(ticket);
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

  async approveKubernetesCommandTicket(
    number: number,
  ): Promise<KubernetesCommandTicketEntity> {
    const ticket =
      await this.kubernetesCommandTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubernetes command ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    const { executionResult } =
      await this.infraHubApiService.manageKubernetesCommand(
        KubernetesCommandTicketMapper.toManageKubernetesCommandRequest(
          ticket,
        ),
      );

    ticket.status = TicketStatus.APPROVED;
    ticket.response = JSON.stringify(executionResult);
    return this.kubernetesCommandTicketsRepository.create(ticket);
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

  async rejectDatacenterTicket(
    number: number,
  ): Promise<DatacenterTicketEntity> {
    const ticket =
      await this.datacenterTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Datacenter ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.datacenterTicketsRepository.create(ticket);
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

  async rejectKubernetesCommandTicket(
    number: number,
  ): Promise<KubernetesCommandTicketEntity> {
    const ticket =
      await this.kubernetesCommandTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubernetes command ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.kubernetesCommandTicketsRepository.create(ticket);
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
