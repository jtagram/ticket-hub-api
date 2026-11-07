import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseBody } from '../../common/dto/response-body.dto';
import { Role } from '../../common/roles/role.enum';
import { IamApiService } from '../iam-api/iam-api.service';
import { InfraHubApiService } from '../infra-hub-api/infra-hub-api.service';
import { FindDatabaseDeploymentsDto } from './dto/find-database-deployments.dto';
import { FindDatabaseNamesDto } from './dto/find-database-names.dto';
import { ValueListMapper } from './mapper/value-list.mapper';
import { ValueListItemResponse } from './value-list-item.response';

/** Anyone who can approve at least one ticket domain is a valid assignee --
 * there's no single cross-domain APPROVER role anymore, so this lists every
 * domain's approver role instead. */
const ASSIGNEE_ROLES: Role[] = [
	Role.ADMIN,
	Role.DATABASE_APPROVER,
	Role.SERVER_APPROVER,
	Role.KUBERNATES_APPROVER,
];

@Injectable()
export class SearchForValueListsService {
	constructor(
		private readonly iamApiService: IamApiService,
		private readonly infraHubApiService: InfraHubApiService,
		private readonly configService: ConfigService,
	) {}

	async findAssignees(): Promise<ResponseBody<ValueListItemResponse[]>> {
		const internalUsers = await this.iamApiService.findInternalUsersByRole(
			this.configService.get<string>('TICKET_HUB_API_APPLICATION_NAME')!,
			ASSIGNEE_ROLES,
		);

		return ValueListMapper.toAssigneesResponse(internalUsers);
	}

	async findDatabaseDeployments(
		dto: FindDatabaseDeploymentsDto,
	): Promise<ResponseBody<ValueListItemResponse[]>> {
		const { deployments } = await this.infraHubApiService.listDeployments(dto.namespace);

		return ValueListMapper.toDatabaseDeploymentsResponse(deployments);
	}

	async findDatabaseNames(
		dto: FindDatabaseNamesDto,
	): Promise<ResponseBody<ValueListItemResponse[]>> {
		const { databases } = await this.infraHubApiService.listDatabases(
			dto.namespace,
			dto.deployment,
		);

		return ValueListMapper.toDatabaseNamesResponse(databases);
	}
}
