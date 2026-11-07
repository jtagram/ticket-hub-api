import { ResponseBody } from '../../../common/dto/response-body.dto';
import { InternalUserResponse } from '../../iam-api/iam-api.types';
import { ValueListItemResponse } from '../value-list-item.response';

const ASSIGNEES_RETRIEVED_MESSAGE = 'Assignees retrieved successfully';
const DEPLOYMENTS_RETRIEVED_MESSAGE = 'Database deployments retrieved successfully';
const DATABASE_NAMES_RETRIEVED_MESSAGE = 'Database names retrieved successfully';

export class ValueListMapper {
	static toAssigneesResponse(
		internalUsers: InternalUserResponse[],
	): ResponseBody<ValueListItemResponse[]> {
		return ResponseBody.success(
			ASSIGNEES_RETRIEVED_MESSAGE,
			internalUsers.map((internalUser) => ({
				value: internalUser.email,
				label: `${internalUser.name} ${internalUser.lastname} (${internalUser.email})`,
			})),
		);
	}

	static toDatabaseDeploymentsResponse(
		deployments: string[],
	): ResponseBody<ValueListItemResponse[]> {
		return ResponseBody.success(DEPLOYMENTS_RETRIEVED_MESSAGE, toItems(deployments));
	}

	static toDatabaseNamesResponse(databases: string[]): ResponseBody<ValueListItemResponse[]> {
		return ResponseBody.success(DATABASE_NAMES_RETRIEVED_MESSAGE, toItems(databases));
	}
}

function toItems(values: string[]): ValueListItemResponse[] {
	return values.map((value) => ({ value, label: value }));
}
