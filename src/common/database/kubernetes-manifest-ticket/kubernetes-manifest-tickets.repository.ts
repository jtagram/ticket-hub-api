import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KubernetesManifestTicketEntity } from './kubernetes-manifest-ticket.entity';

@Injectable()
export class KubernetesManifestTicketsRepository {
  constructor(
    @InjectRepository(KubernetesManifestTicketEntity)
    private readonly repository: Repository<KubernetesManifestTicketEntity>,
  ) {}

  async create(
    ticket: KubernetesManifestTicketEntity,
  ): Promise<KubernetesManifestTicketEntity> {
    return this.repository.save(ticket);
  }

  async findAll(): Promise<KubernetesManifestTicketEntity[]> {
    return this.repository.find();
  }

  async findByNumber(
    number: number,
  ): Promise<KubernetesManifestTicketEntity | null> {
    return this.repository.findOneBy({ number });
  }
}
