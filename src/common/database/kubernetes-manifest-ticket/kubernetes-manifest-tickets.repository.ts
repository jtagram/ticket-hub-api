import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketStatus } from '../ticket-status.enum';
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

  async update(
    ticket: KubernetesManifestTicketEntity,
  ): Promise<KubernetesManifestTicketEntity> {
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

  async findAll(): Promise<KubernetesManifestTicketEntity[]> {
    return this.repository.find({ order: { number: 'ASC' } });
  }

  async findByNumber(
    number: number,
  ): Promise<KubernetesManifestTicketEntity | null> {
    return this.repository.findOneBy({ number });
  }
}
