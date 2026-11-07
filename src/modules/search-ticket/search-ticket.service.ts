import { Injectable, NotFoundException } from '@nestjs/common';
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

const DATABASE_MANAGEMENT_LABEL = 'Database management';
const DATABASE_PROVISIONING_LABEL = 'Database provisioning';
const SERVER_MANAGEMENT_LABEL = 'Server management';
const KUBERNETES_MANIFEST_LABEL = 'Kubernetes manifest';
const KUBECTL_COMMAND_LABEL = 'Kubectl command';

@Injectable()
export class SearchTicketService {
	constructor(
		private readonly databaseManagementTicketsRepository: DatabaseManagementTicketsRepository,
		private readonly databaseProvisioningTicketsRepository: DatabaseProvisioningTicketsRepository,
		private readonly serverManagementTicketsRepository: ServerManagementTicketsRepository,
		private readonly kubernetesManifestTicketsRepository: KubernetesManifestTicketsRepository,
		private readonly kubectlCommandTicketsRepository: KubectlCommandTicketsRepository,
	) {}

	async findAllDatabaseManagementTickets(): Promise<
		ResponseBody<DatabaseManagementTicketEntity[]>
	> {
		const tickets = await this.databaseManagementTicketsRepository.findAll();
		return TicketResponseMapper.toList(DATABASE_MANAGEMENT_LABEL, tickets);
	}

	async findAllDatabaseProvisioningTickets(): Promise<
		ResponseBody<DatabaseProvisioningTicketEntity[]>
	> {
		const tickets = await this.databaseProvisioningTicketsRepository.findAll();
		return TicketResponseMapper.toList(DATABASE_PROVISIONING_LABEL, tickets);
	}

	async findAllServerManagementTickets(): Promise<ResponseBody<ServerManagementTicketEntity[]>> {
		const tickets = await this.serverManagementTicketsRepository.findAll();
		return TicketResponseMapper.toList(SERVER_MANAGEMENT_LABEL, tickets);
	}

	async findAllKubernetesManifestTickets(): Promise<
		ResponseBody<KubernetesManifestTicketEntity[]>
	> {
		const tickets = await this.kubernetesManifestTicketsRepository.findAll();
		return TicketResponseMapper.toList(KUBERNETES_MANIFEST_LABEL, tickets);
	}

	async findAllKubectlCommandTickets(): Promise<ResponseBody<KubectlCommandTicketEntity[]>> {
		const tickets = await this.kubectlCommandTicketsRepository.findAll();
		return TicketResponseMapper.toList(KUBECTL_COMMAND_LABEL, tickets);
	}

	async findDatabaseManagementTicketByNumber(
		number: number,
	): Promise<ResponseBody<DatabaseManagementTicketEntity>> {
		const ticket = await this.databaseManagementTicketsRepository.findByNumber(number);
		if (!ticket) {
			throw new NotFoundException(`Database management ticket with number ${number} not found`);
		}
		return TicketResponseMapper.toFound(DATABASE_MANAGEMENT_LABEL, ticket);
	}

	async findDatabaseProvisioningTicketByNumber(
		number: number,
	): Promise<ResponseBody<DatabaseProvisioningTicketEntity>> {
		const ticket = await this.databaseProvisioningTicketsRepository.findByNumber(number);
		if (!ticket) {
			throw new NotFoundException(`Database provisioning ticket with number ${number} not found`);
		}
		return TicketResponseMapper.toFound(DATABASE_PROVISIONING_LABEL, ticket);
	}

	async findServerManagementTicketByNumber(
		number: number,
	): Promise<ResponseBody<ServerManagementTicketEntity>> {
		const ticket = await this.serverManagementTicketsRepository.findByNumber(number);
		if (!ticket) {
			throw new NotFoundException(`Server management ticket with number ${number} not found`);
		}
		return TicketResponseMapper.toFound(SERVER_MANAGEMENT_LABEL, ticket);
	}

	async findKubernetesManifestTicketByNumber(
		number: number,
	): Promise<ResponseBody<KubernetesManifestTicketEntity>> {
		const ticket = await this.kubernetesManifestTicketsRepository.findByNumber(number);
		if (!ticket) {
			throw new NotFoundException(`Kubernetes manifest ticket with number ${number} not found`);
		}
		return TicketResponseMapper.toFound(KUBERNETES_MANIFEST_LABEL, ticket);
	}

	async findKubectlCommandTicketByNumber(
		number: number,
	): Promise<ResponseBody<KubectlCommandTicketEntity>> {
		const ticket = await this.kubectlCommandTicketsRepository.findByNumber(number);
		if (!ticket) {
			throw new NotFoundException(`Kubectl command ticket with number ${number} not found`);
		}
		return TicketResponseMapper.toFound(KUBECTL_COMMAND_LABEL, ticket);
	}
}
