import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseProvisioningTicketEntity } from './database-provisioning-ticket.entity';

@Injectable()
export class DatabaseProvisioningTicketsRepository {
  constructor(
    @InjectRepository(DatabaseProvisioningTicketEntity)
    private readonly repository: Repository<DatabaseProvisioningTicketEntity>,
  ) {}

  async create(
    ticket: DatabaseProvisioningTicketEntity,
  ): Promise<DatabaseProvisioningTicketEntity> {
    return this.repository.save(ticket);
  }

  async findAll(): Promise<DatabaseProvisioningTicketEntity[]> {
    return this.repository.find();
  }

  async findByNumber(
    number: number,
  ): Promise<DatabaseProvisioningTicketEntity | null> {
    return this.repository.findOneBy({ number });
  }
}
