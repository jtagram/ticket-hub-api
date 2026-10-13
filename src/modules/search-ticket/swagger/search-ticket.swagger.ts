import { applyDecorators, Type } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
} from '@nestjs/swagger';
import { ApiProtected, requiredRolesText } from '../../../common/swagger/api-protected.decorator';
import { Role } from '../../../common/roles/role.enum';
import { DatabaseManagementTicketEntity } from '../../../common/database/database-management-ticket/database-management-ticket.entity';
import { DatabaseProvisioningTicketEntity } from '../../../common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { ServerManagementTicketEntity } from '../../../common/database/server-management-ticket/server-management-ticket.entity';
import { KubernetesManifestTicketEntity } from '../../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { KubectlCommandTicketEntity } from '../../../common/database/kubectl-command-ticket/kubectl-command-ticket.entity';

interface TicketKind {
	/** Name used by the not-found message, e.g. `Database management`. */
	messageName: string;
	/** Lowercase name used in summaries. */
	summaryName: string;
	entity: Type<unknown>;
	/** Roles allowed to read the tickets. */
	roles: Role[];
}

const DATABASE_MANAGEMENT: TicketKind = {
	messageName: 'Database management',
	summaryName: 'database management',
	entity: DatabaseManagementTicketEntity,
	roles: [Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER],
};

const DATABASE_PROVISIONING: TicketKind = {
	messageName: 'Database provisioning',
	summaryName: 'database provisioning',
	entity: DatabaseProvisioningTicketEntity,
	roles: [Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER],
};

const SERVER_MANAGEMENT: TicketKind = {
	messageName: 'Server management',
	summaryName: 'server management',
	entity: ServerManagementTicketEntity,
	roles: [Role.ADMIN, Role.SERVER, Role.SERVER_APPROVER],
};

const KUBERNETES_MANIFEST: TicketKind = {
	messageName: 'Kubernetes manifest',
	summaryName: 'Kubernetes manifest',
	entity: KubernetesManifestTicketEntity,
	roles: [Role.ADMIN, Role.KUBERNATES, Role.KUBERNATES_APPROVER],
};

const KUBECTL_COMMAND: TicketKind = {
	messageName: 'Kubectl command',
	summaryName: 'kubectl command',
	entity: KubectlCommandTicketEntity,
	roles: [Role.ADMIN, Role.KUBERNATES, Role.KUBERNATES_APPROVER],
};

const findAllTickets = (kind: TicketKind) =>
	applyDecorators(
		ApiOperation({
			summary: `List ${kind.summaryName} tickets`,
			description: `Returns every ${kind.summaryName} ticket. ${requiredRolesText(...kind.roles)}`,
		}),
		ApiProtected(),
		ApiOkResponse({
			description: 'Tickets retrieved.',
			type: kind.entity,
			isArray: true,
		}),
	);

const findTicketByNumber = (kind: TicketKind) =>
	applyDecorators(
		ApiOperation({
			summary: `Get a ${kind.summaryName} ticket by number`,
			description: `Returns the ${kind.summaryName} ticket with the given number. ${requiredRolesText(...kind.roles)}`,
		}),
		ApiProtected(),
		ApiParam({
			name: 'number',
			type: Number,
			description: 'Ticket number.',
			example: 42,
		}),
		ApiOkResponse({
			description: 'Ticket retrieved.',
			type: kind.entity,
		}),
		ApiBadRequestResponse({
			description:
				'`Validation failed (numeric string is expected)`: the `number` path parameter is not an integer.',
		}),
		ApiNotFoundResponse({
			description: `\`${kind.messageName} ticket with number {number} not found\`: no ticket has that number.`,
		}),
	);

export const ApiFindAllDatabaseManagementTickets = () => findAllTickets(DATABASE_MANAGEMENT);

export const ApiFindAllDatabaseProvisioningTickets = () => findAllTickets(DATABASE_PROVISIONING);

export const ApiFindAllServerManagementTickets = () => findAllTickets(SERVER_MANAGEMENT);

export const ApiFindAllKubernetesManifestTickets = () => findAllTickets(KUBERNETES_MANIFEST);

export const ApiFindAllKubectlCommandTickets = () => findAllTickets(KUBECTL_COMMAND);

export const ApiFindDatabaseManagementTicketByNumber = () =>
	findTicketByNumber(DATABASE_MANAGEMENT);

export const ApiFindDatabaseProvisioningTicketByNumber = () =>
	findTicketByNumber(DATABASE_PROVISIONING);

export const ApiFindServerManagementTicketByNumber = () => findTicketByNumber(SERVER_MANAGEMENT);

export const ApiFindKubernetesManifestTicketByNumber = () =>
	findTicketByNumber(KUBERNETES_MANIFEST);

export const ApiFindKubectlCommandTicketByNumber = () => findTicketByNumber(KUBECTL_COMMAND);
