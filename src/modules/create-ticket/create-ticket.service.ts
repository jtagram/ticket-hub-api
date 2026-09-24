import { Injectable } from '@nestjs/common';
import { DatabaseTicketEntity } from '../../common/database/database-ticket/database-ticket.entity';
import { DatabaseTicketsRepository } from '../../common/database/database-ticket/database-tickets.repository';
import { DatacenterTicketEntity } from '../../common/database/datacenter-ticket/datacenter-ticket.entity';
import { DatacenterTicketsRepository } from '../../common/database/datacenter-ticket/datacenter-tickets.repository';
import { KubernetesTicketEntity } from '../../common/database/kubernetes-ticket/kubernetes-ticket.entity';
import { KubernetesTicketsRepository } from '../../common/database/kubernetes-ticket/kubernetes-tickets.repository';
import { InfraHubApiService } from '../infra-hub-api/infra-hub-api.service';
import { CreateDatabaseTicketDto } from './dto/create-database-ticket.dto';
import { CreateDatacenterTicketDto } from './dto/create-datacenter-ticket.dto';
import { CreateKubernetesManifestTicketDto } from './dto/create-kubernetes-manifest-ticket.dto';
import { CreateKubernetesCommandTicketDto } from './dto/create-kubernetes-command-ticket.dto';
import { DatabaseTicketMapper } from './mapper/database-ticket.mapper';
import { DatacenterTicketMapper } from './mapper/datacenter-ticket.mapper';
import { KubernetesTicketMapper } from './mapper/kubernetes-ticket.mapper';

@Injectable()
export class CreateTicketService {
  constructor(
    private readonly databaseTicketsRepository: DatabaseTicketsRepository,
    private readonly datacenterTicketsRepository: DatacenterTicketsRepository,
    private readonly kubernetesTicketsRepository: KubernetesTicketsRepository,
    private readonly infraHubApiService: InfraHubApiService,
  ) {}

  async createDatabaseTicket(
    dto: CreateDatabaseTicketDto,
  ): Promise<DatabaseTicketEntity> {
    const ticket = DatabaseTicketMapper.toEntity(dto);
    const savedTicket = await this.databaseTicketsRepository.create(ticket);

    const { executionResult } = await this.infraHubApiService.manageDatabase(
      DatabaseTicketMapper.toManageDatabaseRequest(savedTicket),
    );

    savedTicket.response = JSON.stringify(executionResult);
    return this.databaseTicketsRepository.create(savedTicket);
  }

  async createDatacenterTicket(
    dto: CreateDatacenterTicketDto,
  ): Promise<DatacenterTicketEntity> {
    const ticket = DatacenterTicketMapper.toEntity(dto);
    const savedTicket =
      await this.datacenterTicketsRepository.create(ticket);

    const { executionResult } =
      await this.infraHubApiService.manageServerCommand(
        DatacenterTicketMapper.toManageServerCommandRequest(savedTicket),
      );

    savedTicket.response = JSON.stringify(executionResult);
    return this.datacenterTicketsRepository.create(savedTicket);
  }

  async createKubernetesManifestTicket(
    dto: CreateKubernetesManifestTicketDto,
  ): Promise<KubernetesTicketEntity> {
    const ticket = KubernetesTicketMapper.toManifestEntity(dto);
    const savedTicket =
      await this.kubernetesTicketsRepository.create(ticket);

    const { executionResult } =
      await this.infraHubApiService.manageKubernetesManifest(
        KubernetesTicketMapper.toManageKubernetesManifestRequest(savedTicket),
      );

    savedTicket.response = JSON.stringify(executionResult);
    return this.kubernetesTicketsRepository.create(savedTicket);
  }

  async createKubernetesCommandTicket(
    dto: CreateKubernetesCommandTicketDto,
  ): Promise<KubernetesTicketEntity> {
    const ticket = KubernetesTicketMapper.toCommandEntity(dto);
    const savedTicket =
      await this.kubernetesTicketsRepository.create(ticket);

    const { executionResult } =
      await this.infraHubApiService.manageKubernetesCommand(
        KubernetesTicketMapper.toManageKubernetesCommandRequest(savedTicket),
      );

    savedTicket.response = JSON.stringify(executionResult);
    return this.kubernetesTicketsRepository.create(savedTicket);
  }
}
