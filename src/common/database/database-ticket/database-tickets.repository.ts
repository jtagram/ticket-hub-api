import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatabaseTicketEntity } from './database-ticket.entity';

@Injectable()
export class DatabaseTicketsRepository {
  constructor(
    @InjectRepository(DatabaseTicketEntity)
    private readonly repository: Repository<DatabaseTicketEntity>,
  ) {}

  async create(ticket: DatabaseTicketEntity): Promise<DatabaseTicketEntity> {
    return this.repository.save(ticket);
  }

  async findAll(): Promise<DatabaseTicketEntity[]> {
    return this.repository.find();
  }

  async findByNumber(
    number: number,
  ): Promise<DatabaseTicketEntity | null> {
    return this.repository.findOneBy({ number });
  }
}
