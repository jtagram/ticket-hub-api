import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KubectlCommandTicketEntity } from './kubectl-command-ticket.entity';

@Injectable()
export class KubectlCommandTicketsRepository {
  constructor(
    @InjectRepository(KubectlCommandTicketEntity)
    private readonly repository: Repository<KubectlCommandTicketEntity>,
  ) {}

  async create(
    ticket: KubectlCommandTicketEntity,
  ): Promise<KubectlCommandTicketEntity> {
    return this.repository.save(ticket);
  }

  async findAll(): Promise<KubectlCommandTicketEntity[]> {
    return this.repository.find();
  }

  async findByNumber(
    number: number,
  ): Promise<KubectlCommandTicketEntity | null> {
    return this.repository.findOneBy({ number });
  }
}
