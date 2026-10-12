import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ApiProtected,
  requiredRolesText,
} from '../../../common/swagger/api-protected.decorator';
import { Role } from '../../../common/roles/role.enum';
import { DatabaseManagementTicketEntity } from '../../../common/database/database-management-ticket/database-management-ticket.entity';
import { DatabaseProvisioningTicketEntity } from '../../../common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { ServerManagementTicketEntity } from '../../../common/database/server-management-ticket/server-management-ticket.entity';
import { KubernetesManifestTicketEntity } from '../../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { KubectlCommandTicketEntity } from '../../../common/database/kubectl-command-ticket/kubectl-command-ticket.entity';

const INFORMER_NOTE =
  'The `informer` is always taken from the email of the authenticated user; a value sent in the body is ignored.';

const COMMON_BAD_REQUEST_CASES = [
  '- `<property> must be a string` / `<property> should not be empty`: a required field is missing, empty or not a string.',
  '- `informer must be an email`: a non-empty `informer` that is not an email is rejected even though its value is ignored.',
  '- `<property> must not be blank`: a required text field is empty or contains only whitespace.',
  '- `<property> must be shorter than or equal to <n> characters`: a text field exceeds its maximum length.',
  '- `<property> should not exist`: the body has a property that is not part of the ticket.',
];

const badRequestDescription = (...extraCases: string[]) =>
  [
    'Invalid body. Each message names the offending property:',
    ...COMMON_BAD_REQUEST_CASES,
    ...extraCases,
  ].join('\n');

export const ApiCreateDatabaseManagementTicket = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a database management ticket',
      description: `Creates an \`OPEN\` ticket that runs SQL code on a database once it is approved. ${requiredRolesText(Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER)} ${INFORMER_NOTE}`,
    }),
    ApiProtected(),
    ApiCreatedResponse({
      description: 'Ticket created.',
      type: DatabaseManagementTicketEntity,
    }),
    ApiBadRequestResponse({ description: badRequestDescription() }),
  );

export const ApiCreateDatabaseProvisioningTicket = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a database provisioning ticket',
      description: `Creates an \`OPEN\` ticket that creates a new database once it is approved. ${requiredRolesText(Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER)} ${INFORMER_NOTE}`,
    }),
    ApiProtected(),
    ApiCreatedResponse({
      description: 'Ticket created.',
      type: DatabaseProvisioningTicketEntity,
    }),
    ApiBadRequestResponse({
      description: badRequestDescription(
        '- `newDbName must be a valid lowercase Postgres identifier`: `newDbName` does not match `^[a-z_][a-z0-9_]*$`.',
      ),
    }),
  );

export const ApiCreateServerManagementTicket = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a server management ticket',
      description: `Creates an \`OPEN\` ticket that runs an Ansible playbook on the servers once it is approved. ${requiredRolesText(Role.ADMIN, Role.SERVER, Role.SERVER_APPROVER)} ${INFORMER_NOTE}`,
    }),
    ApiProtected(),
    ApiCreatedResponse({
      description: 'Ticket created.',
      type: ServerManagementTicketEntity,
    }),
    ApiBadRequestResponse({ description: badRequestDescription() }),
  );

export const ApiCreateKubernetesManifestTicket = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a Kubernetes manifest ticket',
      description: `Creates an \`OPEN\` ticket that applies, creates or deletes a Kubernetes manifest once it is approved. ${requiredRolesText(Role.ADMIN, Role.KUBERNATES, Role.KUBERNATES_APPROVER)} ${INFORMER_NOTE}`,
    }),
    ApiProtected(),
    ApiCreatedResponse({
      description: 'Ticket created.',
      type: KubernetesManifestTicketEntity,
    }),
    ApiBadRequestResponse({
      description: badRequestDescription(
        '- `action must be one of the following values: apply, delete, create`: `action` is not a supported kubectl action.',
      ),
    }),
  );

export const ApiCreateKubectlCommandTicket = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a kubectl command ticket',
      description: `Creates an \`OPEN\` ticket that runs a kubectl command once it is approved. ${requiredRolesText(Role.ADMIN, Role.KUBERNATES, Role.KUBERNATES_APPROVER)} ${INFORMER_NOTE}`,
    }),
    ApiProtected(),
    ApiCreatedResponse({
      description: 'Ticket created.',
      type: KubectlCommandTicketEntity,
    }),
    ApiBadRequestResponse({ description: badRequestDescription() }),
  );
