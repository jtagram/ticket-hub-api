import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseTicketEntity } from '../../common/database/database-ticket/database-ticket.entity';
import { DatabaseTicketsRepository } from '../../common/database/database-ticket/database-tickets.repository';
import { DatacenterTicketEntity } from '../../common/database/datacenter-ticket/datacenter-ticket.entity';
import { DatacenterTicketsRepository } from '../../common/database/datacenter-ticket/datacenter-tickets.repository';
import { KubernetesTicketEntity } from '../../common/database/kubernetes-ticket/kubernetes-ticket.entity';
import { KubernetesTicketsRepository } from '../../common/database/kubernetes-ticket/kubernetes-tickets.repository';

@Injectable()
export class SearchTicketService {
  constructor(
    private readonly databaseTicketsRepository: DatabaseTicketsRepository,
    private readonly datacenterTicketsRepository: DatacenterTicketsRepository,
    private readonly kubernetesTicketsRepository: KubernetesTicketsRepository,
  ) {}

  async findAllDatabaseTickets(): Promise<DatabaseTicketEntity[]> {
    return this.databaseTicketsRepository.findAll();
  }

  async findAllDatacenterTickets(): Promise<DatacenterTicketEntity[]> {
    return this.datacenterTicketsRepository.findAll();
  }

  async findAllKubernetesTickets(): Promise<KubernetesTicketEntity[]> {
    return this.kubernetesTicketsRepository.findAll();
  }

  async findDatabaseTicketByNumber(
    number: number,
  ): Promise<DatabaseTicketEntity> {
    const ticket = await this.databaseTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Database ticket with number ${number} not found`,
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

  async findKubernetesTicketByNumber(
    number: number,
  ): Promise<KubernetesTicketEntity> {
    const ticket =
      await this.kubernetesTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubernetes ticket with number ${number} not found`,
      );
    }
    return ticket;
  }
}
