import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KubernetesTicketEntity } from './kubernetes-ticket.entity';

@Injectable()
export class KubernetesTicketsRepository {
  constructor(
    @InjectRepository(KubernetesTicketEntity)
    private readonly repository: Repository<KubernetesTicketEntity>,
  ) {}

  async create(
    ticket: KubernetesTicketEntity,
  ): Promise<KubernetesTicketEntity> {
    return this.repository.save(ticket);
  }
}
