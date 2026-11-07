import { Injectable } from '@nestjs/common';
import { ResponseBody } from '../../common/dto/response-body.dto';
import { TicketResponseMapper } from '../../common/mapper/ticket-response.mapper';
import { DatabaseManagementTicketEntity } from '../../common/database/database-management-ticket/database-management-ticket.entity';
import { DatabaseManagementTicketsRepository } from '../../common/database/database-management-ticket/database-management-tickets.repository';
import { DatabaseProvisioningTicketEntity } from '../../common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { DatabaseProvisioningTicketsRepository } from '../../common/database/database-provisioning-ticket/database-provisioning-tickets.repository';
import { ServerManagementTicketEntity } from '../../common/database/server-management-ticket/server-management-ticket.entity';
import { ServerManagementTicketsRepository } from '../../common/database/server-management-ticket/server-management-tickets.repository';
import { KubernetesManifestTicketEntity } from '../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { KubernetesManifestTicketsRepository } from '../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-tickets.repository';
import { KubectlCommandTicketEntity } from '../../common/database/kubectl-command-ticket/kubectl-command-ticket.entity';
import { KubectlCommandTicketsRepository } from '../../common/database/kubectl-command-ticket/kubectl-command-tickets.repository';
import { CreateDatabaseManagementTicketDto } from './dto/create-database-management-ticket.dto';
import { CreateDatabaseProvisioningTicketDto } from './dto/create-database-provisioning-ticket.dto';
import { CreateServerManagementTicketDto } from './dto/create-server-management-ticket.dto';
import { CreateKubernetesManifestTicketDto } from './dto/create-kubernetes-manifest-ticket.dto';
import { CreateKubectlCommandTicketDto } from './dto/create-kubectl-command-ticket.dto';
import { DatabaseManagementTicketMapper } from './mapper/database-management-ticket.mapper';
import { DatabaseProvisioningTicketMapper } from './mapper/database-provisioning-ticket.mapper';
import { ServerManagementTicketMapper } from './mapper/server-management-ticket.mapper';
import { KubernetesManifestTicketMapper } from './mapper/kubernetes-manifest-ticket.mapper';
import { KubectlCommandTicketMapper } from './mapper/kubectl-command-ticket.mapper';

const DATABASE_MANAGEMENT_LABEL = 'Database management';
const DATABASE_PROVISIONING_LABEL = 'Database provisioning';
const SERVER_MANAGEMENT_LABEL = 'Server management';
const KUBERNETES_MANIFEST_LABEL = 'Kubernetes manifest';
const KUBECTL_COMMAND_LABEL = 'Kubectl command';

@Injectable()
export class CreateTicketService {
	constructor(
		private readonly databaseManagementTicketsRepository: DatabaseManagementTicketsRepository,
		private readonly databaseProvisioningTicketsRepository: DatabaseProvisioningTicketsRepository,
		private readonly serverManagementTicketsRepository: ServerManagementTicketsRepository,
		private readonly kubernetesManifestTicketsRepository: KubernetesManifestTicketsRepository,
		private readonly kubectlCommandTicketsRepository: KubectlCommandTicketsRepository,
	) {}

	async createDatabaseManagementTicket(
		dto: CreateDatabaseManagementTicketDto,
	): Promise<ResponseBody<DatabaseManagementTicketEntity>> {
		const ticket = DatabaseManagementTicketMapper.toEntity(dto);
		const created = await this.databaseManagementTicketsRepository.create(ticket);
		return TicketResponseMapper.toCreated(DATABASE_MANAGEMENT_LABEL, created);
	}

	async createDatabaseProvisioningTicket(
		dto: CreateDatabaseProvisioningTicketDto,
	): Promise<ResponseBody<DatabaseProvisioningTicketEntity>> {
		const ticket = DatabaseProvisioningTicketMapper.toEntity(dto);
		const created = await this.databaseProvisioningTicketsRepository.create(ticket);
		return TicketResponseMapper.toCreated(DATABASE_PROVISIONING_LABEL, created);
	}

	async createServerManagementTicket(
		dto: CreateServerManagementTicketDto,
	): Promise<ResponseBody<ServerManagementTicketEntity>> {
		const ticket = ServerManagementTicketMapper.toEntity(dto);
		const created = await this.serverManagementTicketsRepository.create(ticket);
		return TicketResponseMapper.toCreated(SERVER_MANAGEMENT_LABEL, created);
	}

	async createKubernetesManifestTicket(
		dto: CreateKubernetesManifestTicketDto,
	): Promise<ResponseBody<KubernetesManifestTicketEntity>> {
		const ticket = KubernetesManifestTicketMapper.toEntity(dto);
		const created = await this.kubernetesManifestTicketsRepository.create(ticket);
		return TicketResponseMapper.toCreated(KUBERNETES_MANIFEST_LABEL, created);
	}

	async createKubectlCommandTicket(
		dto: CreateKubectlCommandTicketDto,
	): Promise<ResponseBody<KubectlCommandTicketEntity>> {
		const ticket = KubectlCommandTicketMapper.toEntity(dto);
		const created = await this.kubectlCommandTicketsRepository.create(ticket);
		return TicketResponseMapper.toCreated(KUBECTL_COMMAND_LABEL, created);
	}
}
