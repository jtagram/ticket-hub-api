import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServerManagementTicketEntity } from './server-management-ticket.entity';

@Injectable()
export class ServerManagementTicketsRepository {
  constructor(
    @InjectRepository(ServerManagementTicketEntity)
    private readonly repository: Repository<ServerManagementTicketEntity>,
  ) {}

  async create(
    ticket: ServerManagementTicketEntity,
  ): Promise<ServerManagementTicketEntity> {
    return this.repository.save(ticket);
  }

  async findAll(): Promise<ServerManagementTicketEntity[]> {
    return this.repository.find();
  }

  async findByNumber(
    number: number,
  ): Promise<ServerManagementTicketEntity | null> {
    return this.repository.findOneBy({ number });
  }
}
