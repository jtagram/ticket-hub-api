import { Injectable } from '@nestjs/common';
import { IamApiService } from '../iam-api/iam-api.service';
import { InfraHubApiService } from '../infra-hub-api/infra-hub-api.service';
import { FindDatabaseDeploymentsDto } from './dto/find-database-deployments.dto';
import { FindDatabaseNamesDto } from './dto/find-database-names.dto';
import { ValueListItemResponse } from './value-list-item.response';

/** The application whose ADMIN/APPROVER roles determine who can be a ticket assignee. */
const TICKET_HUB_APPLICATION_NAME = 'ticket-hub';
const ASSIGNEE_ROLES = ['ADMIN', 'APPROVER'];

@Injectable()
export class SearchForValueListsService {
  constructor(
    private readonly iamApiService: IamApiService,
    private readonly infraHubApiService: InfraHubApiService,
  ) {}

  async findAssignees(): Promise<ValueListItemResponse[]> {
    const internalUsers = await this.iamApiService.findInternalUsersByRole(
      TICKET_HUB_APPLICATION_NAME,
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
