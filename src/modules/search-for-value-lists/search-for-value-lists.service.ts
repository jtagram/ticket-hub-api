import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '../../common/roles/role.enum';
import { IamApiService } from '../iam-api/iam-api.service';
import { InfraHubApiService } from '../infra-hub-api/infra-hub-api.service';
import { FindDatabaseDeploymentsDto } from './dto/find-database-deployments.dto';
import { FindDatabaseNamesDto } from './dto/find-database-names.dto';
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

  async findAssignees(): Promise<ValueListItemResponse[]> {
    const internalUsers = await this.iamApiService.findInternalUsersByRole(
      this.configService.get<string>('TICKET_HUB_API_APPLICATION_NAME')!,
      ASSIGNEE_ROLES,
    );

    return internalUsers.map((internalUser) => ({
      value: internalUser.email,
      label: `${internalUser.name} ${internalUser.lastname} (${internalUser.email})`,
    }));
  }

  async findDatabaseDeployments(
    dto: FindDatabaseDeploymentsDto,
  ): Promise<ValueListItemResponse[]> {
    const { deployments } = await this.infraHubApiService.listDeployments(
      dto.namespace,
    );

    return deployments.map((deployment) => ({
      value: deployment,
      label: deployment,
    }));
  }

  async findDatabaseNames(
    dto: FindDatabaseNamesDto,
  ): Promise<ValueListItemResponse[]> {
    const { databases } = await this.infraHubApiService.listDatabases(
      dto.namespace,
      dto.deployment,
    );

    return databases.map((dbName) => ({
      value: dbName,
      label: dbName,
    }));
  }
}
