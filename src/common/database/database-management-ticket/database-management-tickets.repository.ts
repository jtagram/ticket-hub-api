import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseManagementTicketEntity } from './database-management-ticket.entity';

@Injectable()
export class DatabaseManagementTicketsRepository {
  constructor(
    @InjectRepository(DatabaseManagementTicketEntity)
    private readonly repository: Repository<DatabaseManagementTicketEntity>,
  ) {}

  async create(
    ticket: DatabaseManagementTicketEntity,
  ): Promise<DatabaseManagementTicketEntity> {
    return this.repository.save(ticket);
  }

  async findAll(): Promise<DatabaseManagementTicketEntity[]> {
    return this.repository.find();
  }

  async findByNumber(
    number: number,
  ): Promise<DatabaseManagementTicketEntity | null> {
    return this.repository.findOneBy({ number });
  }
}
