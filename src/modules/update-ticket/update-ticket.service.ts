import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseTicketEntity } from '../../common/database/database-ticket/database-ticket.entity';
import { DatabaseTicketsRepository } from '../../common/database/database-ticket/database-tickets.repository';
import { DatabaseProvisioningTicketEntity } from '../../common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { DatabaseProvisioningTicketsRepository } from '../../common/database/database-provisioning-ticket/database-provisioning-tickets.repository';
import { DatacenterTicketEntity } from '../../common/database/datacenter-ticket/datacenter-ticket.entity';
import { DatacenterTicketsRepository } from '../../common/database/datacenter-ticket/datacenter-tickets.repository';
import { KubernetesTicketEntity } from '../../common/database/kubernetes-ticket/kubernetes-ticket.entity';
import { KubernetesTicketsRepository } from '../../common/database/kubernetes-ticket/kubernetes-tickets.repository';
import { KubernetesExecutionType } from '../../common/database/kubernetes-ticket/kubernetes-execution-type.enum';
import { TicketStatus } from '../../common/database/ticket-status.enum';
import { InfraHubApiService } from '../infra-hub-api/infra-hub-api.service';
import { DatabaseTicketMapper } from '../create-ticket/mapper/database-ticket.mapper';
import { DatabaseProvisioningTicketMapper } from '../create-ticket/mapper/database-provisioning-ticket.mapper';
import { DatacenterTicketMapper } from '../create-ticket/mapper/datacenter-ticket.mapper';
import { KubernetesTicketMapper } from '../create-ticket/mapper/kubernetes-ticket.mapper';

@Injectable()
export class UpdateTicketService {
  constructor(
    private readonly databaseTicketsRepository: DatabaseTicketsRepository,
    private readonly databaseProvisioningTicketsRepository: DatabaseProvisioningTicketsRepository,
    private readonly datacenterTicketsRepository: DatacenterTicketsRepository,
    private readonly kubernetesTicketsRepository: KubernetesTicketsRepository,
    private readonly infraHubApiService: InfraHubApiService,
  ) {}

  async approveDatabaseTicket(number: number): Promise<DatabaseTicketEntity> {
    const ticket = await this.databaseTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Database ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    const { executionResult } = await this.infraHubApiService.manageDatabase(
      DatabaseTicketMapper.toManageDatabaseRequest(ticket),
    );

    ticket.status = TicketStatus.APPROVED;
    ticket.response = JSON.stringify(executionResult);
    return this.databaseTicketsRepository.create(ticket);
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

  async approveKubernetesTicket(
    number: number,
  ): Promise<KubernetesTicketEntity> {
    const ticket =
      await this.kubernetesTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubernetes ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    const { executionResult } =
      ticket.executionType === KubernetesExecutionType.MANIFEST
        ? await this.infraHubApiService.manageKubernetesManifest(
            KubernetesTicketMapper.toManageKubernetesManifestRequest(ticket),
          )
        : await this.infraHubApiService.manageKubernetesCommand(
            KubernetesTicketMapper.toManageKubernetesCommandRequest(ticket),
          );

    ticket.status = TicketStatus.APPROVED;
    ticket.response = JSON.stringify(executionResult);
    return this.kubernetesTicketsRepository.create(ticket);
  }

  async rejectDatabaseTicket(number: number): Promise<DatabaseTicketEntity> {
    const ticket = await this.databaseTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Database ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.databaseTicketsRepository.create(ticket);
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

  async rejectKubernetesTicket(
    number: number,
  ): Promise<KubernetesTicketEntity> {
    const ticket =
      await this.kubernetesTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubernetes ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.kubernetesTicketsRepository.create(ticket);
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
