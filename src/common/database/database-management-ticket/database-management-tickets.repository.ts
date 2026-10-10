import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketStatus } from '../ticket-status.enum';
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

  async update(
    ticket: DatabaseManagementTicketEntity,
  ): Promise<DatabaseManagementTicketEntity> {
    return this.repository.save(ticket);
  }

  /**
   * Atomically moves the ticket from OPEN to IN_PROGRESS with a single
   * conditional UPDATE. Returns true only for the caller that won the claim;
   * false means the ticket does not exist or is no longer OPEN.
   */
  async claimForApproval(number: number): Promise<boolean> {
    const result = await this.repository.update(
      { number, status: TicketStatus.OPEN },
      { status: TicketStatus.IN_PROGRESS },
    );
    return (result.affected ?? 0) > 0;
  }

  async findAll(): Promise<DatabaseManagementTicketEntity[]> {
    return this.repository.find({ order: { number: 'ASC' } });
  }

  async findByNumber(
    number: number,
  ): Promise<DatabaseManagementTicketEntity | null> {
    return this.repository.findOneBy({ number });
  }
}
