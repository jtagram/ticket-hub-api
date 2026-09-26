import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseManagementTicketEntity } from '../../common/database/database-management-ticket/database-management-ticket.entity';
import { DatabaseManagementTicketsRepository } from '../../common/database/database-management-ticket/database-management-tickets.repository';
import { DatacenterTicketEntity } from '../../common/database/datacenter-ticket/datacenter-ticket.entity';
import { DatacenterTicketsRepository } from '../../common/database/datacenter-ticket/datacenter-tickets.repository';
import { KubernetesManifestTicketEntity } from '../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { KubernetesManifestTicketsRepository } from '../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-tickets.repository';
import { KubernetesCommandTicketEntity } from '../../common/database/kubernetes-command-ticket/kubernetes-command-ticket.entity';
import { KubernetesCommandTicketsRepository } from '../../common/database/kubernetes-command-ticket/kubernetes-command-tickets.repository';

@Injectable()
export class SearchTicketService {
  constructor(
    private readonly databaseManagementTicketsRepository: DatabaseManagementTicketsRepository,
    private readonly datacenterTicketsRepository: DatacenterTicketsRepository,
    private readonly kubernetesManifestTicketsRepository: KubernetesManifestTicketsRepository,
    private readonly kubernetesCommandTicketsRepository: KubernetesCommandTicketsRepository,
  ) {}

  async findAllDatabaseManagementTickets(): Promise<
    DatabaseManagementTicketEntity[]
  > {
    return this.databaseManagementTicketsRepository.findAll();
  }

  async findAllDatacenterTickets(): Promise<DatacenterTicketEntity[]> {
    return this.datacenterTicketsRepository.findAll();
  }

  async findAllKubernetesManifestTickets(): Promise<
    KubernetesManifestTicketEntity[]
  > {
    return this.kubernetesManifestTicketsRepository.findAll();
  }

  async findAllKubernetesCommandTickets(): Promise<
    KubernetesCommandTicketEntity[]
  > {
    return this.kubernetesCommandTicketsRepository.findAll();
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

  async findDatacenterTicketByNumber(
    number: number,
  ): Promise<DatacenterTicketEntity> {
    const ticket =
      await this.datacenterTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Datacenter ticket with number ${number} not found`,
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

  async findKubernetesCommandTicketByNumber(
    number: number,
  ): Promise<KubernetesCommandTicketEntity> {
    const ticket =
      await this.kubernetesCommandTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubernetes command ticket with number ${number} not found`,
      );
    }
    return ticket;
  }
}
