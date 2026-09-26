import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KubernetesCommandTicketEntity } from './kubernetes-command-ticket.entity';

@Injectable()
export class KubernetesCommandTicketsRepository {
  constructor(
    @InjectRepository(KubernetesCommandTicketEntity)
    private readonly repository: Repository<KubernetesCommandTicketEntity>,
  ) {}

  async create(
    ticket: KubernetesCommandTicketEntity,
  ): Promise<KubernetesCommandTicketEntity> {
    return this.repository.save(ticket);
  }

  async findAll(): Promise<KubernetesCommandTicketEntity[]> {
    return this.repository.find();
  }

  async findByNumber(
    number: number,
  ): Promise<KubernetesCommandTicketEntity | null> {
    return this.repository.findOneBy({ number });
  }
}
