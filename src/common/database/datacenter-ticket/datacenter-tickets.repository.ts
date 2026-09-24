import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DatacenterTicketEntity } from './datacenter-ticket.entity';

@Injectable()
export class DatacenterTicketsRepository {
  constructor(
    @InjectRepository(DatacenterTicketEntity)
    private readonly repository: Repository<DatacenterTicketEntity>,
  ) {}

  async create(
    ticket: DatacenterTicketEntity,
  ): Promise<DatacenterTicketEntity> {
    return this.repository.save(ticket);
  }
}
