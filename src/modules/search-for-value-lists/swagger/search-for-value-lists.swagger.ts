import { applyDecorators } from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
} from '@nestjs/swagger';
import { ApiProtected, requiredRolesText } from '../../../common/swagger/api-protected.decorator';
import { Role } from '../../../common/roles/role.enum';
import { ValueListItemResponse } from '../value-list-item.response';

const UNEXPECTED_ERROR_CASE =
	'- `An unexpected error occurred. Please try again later.`: the service login against iam-api failed or another unexpected error occurred.';

const INFRA_HUB_RELAY_NOTE =
	'If infra-hub-api answers with an error, its status and body are relayed as they are.';

export const ApiFindAssignees = () =>
	applyDecorators(
		ApiOperation({
			summary: 'List possible assignees',
			description: `Returns the internal users of the ticket-hub-api application who hold an approver role (\`ADMIN\`, \`DATABASE_APPROVER\`, \`SERVER_APPROVER\` or \`KUBERNATES_APPROVER\`), as \`value\` (email) and \`label\` pairs for a select input. ${requiredRolesText(
				Role.ADMIN,
				Role.DATABASE,
				Role.DATABASE_APPROVER,
				Role.SERVER,
				Role.SERVER_APPROVER,
				Role.KUBERNATES,
				Role.KUBERNATES_APPROVER,
			)}`,
		}),
		ApiProtected(),
		ApiOkResponse({
			description: 'Assignees retrieved.',
			type: ValueListItemResponse,
			isArray: true,
		}),
		ApiInternalServerErrorResponse({
			description: ['Unexpected failure:', UNEXPECTED_ERROR_CASE].join('\n'),
		}),
	);

export const ApiFindDatabaseDeployments = () =>
	applyDecorators(
		ApiOperation({
			summary: 'List database deployments',
			description: `Returns the deployments of a Kubernetes namespace, as \`value\` and \`label\` pairs for a select input. ${INFRA_HUB_RELAY_NOTE} ${requiredRolesText(Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER)}`,
		}),
		ApiProtected(),
		ApiOkResponse({
			description: 'Deployments retrieved.',
			type: ValueListItemResponse,
			isArray: true,
		}),
		ApiBadRequestResponse({
			description: [
				'Invalid query:',
				'- `namespace should not be empty` / `namespace must be a string`: `namespace` is missing, empty or not a string.',
				'- `namespace must be shorter than or equal to 63 characters`: `namespace` is too long.',
				'- `property <name> should not exist`: the query has a parameter that is not accepted.',
			].join('\n'),
		}),
		ApiInternalServerErrorResponse({
			description: ['Unexpected failure:', UNEXPECTED_ERROR_CASE].join('\n'),
		}),
	);

export const ApiFindDatabaseNames = () =>
	applyDecorators(
		ApiOperation({
			summary: 'List database names',
			description: `Returns the databases of a deployment, as \`value\` and \`label\` pairs for a select input. ${INFRA_HUB_RELAY_NOTE} ${requiredRolesText(Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER)}`,
		}),
		ApiProtected(),
		ApiOkResponse({
			description: 'Database names retrieved.',
			type: ValueListItemResponse,
			isArray: true,
		}),
		ApiBadRequestResponse({
			description: [
				'Invalid query:',
				'- `namespace should not be empty` / `deployment should not be empty`: a parameter is missing or empty (also `must be a string`).',
				'- `namespace must be shorter than or equal to 63 characters` / `deployment must be shorter than or equal to 63 characters`: a parameter is too long.',
				'- `property <name> should not exist`: the query has a parameter that is not accepted.',
			].join('\n'),
		}),
		ApiInternalServerErrorResponse({
			description: ['Unexpected failure:', UNEXPECTED_ERROR_CASE].join('\n'),
		}),
	);
