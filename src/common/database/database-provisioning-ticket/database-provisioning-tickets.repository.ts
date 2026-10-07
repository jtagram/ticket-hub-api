import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketStatus } from '../ticket-status.enum';
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

  async update(
    ticket: DatabaseProvisioningTicketEntity,
  ): Promise<DatabaseProvisioningTicketEntity> {
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

  /**
   * Atomically moves the ticket back from IN_PROGRESS to OPEN. Returns false
   * when the ticket was not IN_PROGRESS (nothing was changed).
   */
  async releaseClaim(number: number): Promise<boolean> {
    const result = await this.repository.update(
      { number, status: TicketStatus.IN_PROGRESS },
      { status: TicketStatus.OPEN },
    );
    return (result.affected ?? 0) > 0;
  }

  async findAll(): Promise<DatabaseProvisioningTicketEntity[]> {
    return this.repository.find({ order: { number: 'ASC' } });
  }

  async findByNumber(
    number: number,
  ): Promise<DatabaseProvisioningTicketEntity | null> {
    return this.repository.findOneBy({ number });
  }
}
