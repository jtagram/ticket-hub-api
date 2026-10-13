import { applyDecorators, Type } from '@nestjs/common';
import {
	ApiBadGatewayResponse,
	ApiBadRequestResponse,
	ApiConflictResponse,
	ApiInternalServerErrorResponse,
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
	/** Name used by the approval messages, e.g. `Database management`. */
	approvalName: string;
	/** Lowercase name used in summaries. */
	summaryName: string;
	entity: Type<unknown>;
	/** Roles allowed to approve or reject the ticket. */
	roles: Role[];
	/** What happens when the ticket is approved. */
	approvalEffect: string;
}

const DATABASE_MANAGEMENT: TicketKind = {
	messageName: 'Database management',
	approvalName: 'Database management',
	summaryName: 'database management',
	entity: DatabaseManagementTicketEntity,
	roles: [Role.ADMIN, Role.DATABASE_APPROVER],
	approvalEffect: 'runs the SQL code on the database',
};

const DATABASE_PROVISIONING: TicketKind = {
	messageName: 'Database provisioning',
	approvalName: 'Database provisioning',
	summaryName: 'database provisioning',
	entity: DatabaseProvisioningTicketEntity,
	roles: [Role.ADMIN, Role.DATABASE_APPROVER],
	approvalEffect: 'creates the new database',
};

const SERVER_MANAGEMENT: TicketKind = {
	messageName: 'Server management',
	approvalName: 'Server management',
	summaryName: 'server management',
	entity: ServerManagementTicketEntity,
	roles: [Role.ADMIN, Role.SERVER_APPROVER],
	approvalEffect: 'runs the Ansible playbook',
};

const KUBERNETES_MANIFEST: TicketKind = {
	messageName: 'Kubernetes manifest',
	approvalName: 'Kubernetes manifest',
	summaryName: 'Kubernetes manifest',
	entity: KubernetesManifestTicketEntity,
	roles: [Role.ADMIN, Role.KUBERNATES_APPROVER],
	approvalEffect: 'applies the manifest with the requested action',
};

const KUBECTL_COMMAND: TicketKind = {
	messageName: 'Kubectl command',
	approvalName: 'Kubectl command',
	summaryName: 'kubectl command',
	entity: KubectlCommandTicketEntity,
	roles: [Role.ADMIN, Role.KUBERNATES_APPROVER],
	approvalEffect: 'runs the kubectl command',
};

const numberParam = () =>
	ApiParam({
		name: 'number',
		type: Number,
		description: 'Ticket number.',
		example: 42,
	});

const invalidNumberResponse = () =>
	ApiBadRequestResponse({
		description:
			'`Validation failed (numeric string is expected)`: the `number` path parameter is not an integer.',
	});

const notFoundResponse = (kind: TicketKind) =>
	ApiNotFoundResponse({
		description: `\`${kind.messageName} ticket with number {number} not found\`: no ticket has that number.`,
	});

const approveTicket = (kind: TicketKind) =>
	applyDecorators(
		ApiOperation({
			summary: `Approve a ${kind.summaryName} ticket`,
			description: [
				`Approves an \`OPEN\` ${kind.summaryName} ticket: it is claimed (\`IN_PROGRESS\`), infra-hub-api ${kind.approvalEffect} and, when the execution succeeds, the ticket becomes \`APPROVED\` and the execution result is saved in its \`response\`.`,
				'If infra-hub-api rejects the request, its status and body are relayed as they are; the ticket stays `IN_PROGRESS` and is never moved back to `OPEN`.',
				requiredRolesText(...kind.roles),
			].join(' '),
		}),
		ApiProtected(),
		numberParam(),
		ApiOkResponse({
			description: 'Ticket approved.',
			type: kind.entity,
		}),
		invalidNumberResponse(),
		notFoundResponse(kind),
		ApiConflictResponse({
			description: [
				'The ticket cannot be approved:',
				'- `Ticket with number {number} is already {status}, it cannot be approved`: the ticket is not `OPEN`.',
				'- `Ticket with number {number} could not be approved: it was claimed by another request or it is no longer OPEN`: a concurrent approval won the claim.',
			].join('\n'),
		}),
		ApiBadGatewayResponse({
			description: [
				'infra-hub-api reported a failed execution; the ticket stays `IN_PROGRESS` and will not be executed again:',
				`- \`infra-hub-api reported that the execution for ${kind.approvalName} ticket {number} failed. The ticket stays IN_PROGRESS and the execution result was saved in its response; it will not be executed again.\``,
				`- \`infra-hub-api reported that the execution for ${kind.approvalName} ticket {number} failed. The ticket is still IN_PROGRESS but the execution result could not be saved: contact an administrator to reconcile it.\``,
			].join('\n'),
		}),
		ApiInternalServerErrorResponse({
			description: [
				'Unexpected failure:',
				`- \`The action of ${kind.approvalName} ticket {number} WAS executed by infra-hub-api, but the ticket status could not be saved and it is still IN_PROGRESS. Do not approve it again: contact an administrator to reconcile it.\``,
				'- `An unexpected error occurred. Please try again later.`: a database or other unexpected error.',
			].join('\n'),
		}),
	);

const rejectTicket = (kind: TicketKind) =>
	applyDecorators(
		ApiOperation({
			summary: `Reject a ${kind.summaryName} ticket`,
			description: [
				`Rejects an \`OPEN\` ${kind.summaryName} ticket: its status becomes \`REJECTED\` and nothing is executed.`,
				requiredRolesText(...kind.roles),
			].join(' '),
		}),
		ApiProtected(),
		numberParam(),
		ApiOkResponse({
			description: 'Ticket rejected.',
			type: kind.entity,
		}),
		invalidNumberResponse(),
		notFoundResponse(kind),
		ApiConflictResponse({
			description:
				'`Ticket with number {number} is already {status}, it cannot be rejected`: the ticket is not `OPEN`.',
		}),
	);

export const ApiApproveDatabaseManagementTicket = () => approveTicket(DATABASE_MANAGEMENT);

export const ApiApproveDatabaseProvisioningTicket = () => approveTicket(DATABASE_PROVISIONING);

export const ApiApproveServerManagementTicket = () => approveTicket(SERVER_MANAGEMENT);

export const ApiApproveKubernetesManifestTicket = () => approveTicket(KUBERNETES_MANIFEST);

export const ApiApproveKubectlCommandTicket = () => approveTicket(KUBECTL_COMMAND);

export const ApiRejectDatabaseManagementTicket = () => rejectTicket(DATABASE_MANAGEMENT);

export const ApiRejectDatabaseProvisioningTicket = () => rejectTicket(DATABASE_PROVISIONING);

export const ApiRejectServerManagementTicket = () => rejectTicket(SERVER_MANAGEMENT);

export const ApiRejectKubernetesManifestTicket = () => rejectTicket(KUBERNETES_MANIFEST);

export const ApiRejectKubectlCommandTicket = () => rejectTicket(KUBECTL_COMMAND);
