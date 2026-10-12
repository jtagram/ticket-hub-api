import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../../common/guards/roles.decorator';
import { Role } from '../../common/roles/role.enum';
import { SearchForValueListsService } from './search-for-value-lists.service';
import { FindDatabaseDeploymentsDto } from './dto/find-database-deployments.dto';
import { FindDatabaseNamesDto } from './dto/find-database-names.dto';
import { ValueListItemResponse } from './value-list-item.response';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiFindAssignees,
  ApiFindDatabaseDeployments,
  ApiFindDatabaseNames,
} from './swagger/search-for-value-lists.swagger';

@Controller('search-for-value-lists')
@ApiTags('Search for value lists')
export class SearchForValueListsController {
  constructor(
    private readonly searchForValueListsService: SearchForValueListsService,
  ) {}

  // Shared by the five ticket creation forms, so every role that can create a
  // ticket of some domain may read it. COMMON_USER is intentionally excluded.
  @ApiFindAssignees()
  @Get('assignees')
  @Roles(
    Role.ADMIN,
    Role.DATABASE,
    Role.DATABASE_APPROVER,
    Role.SERVER,
    Role.SERVER_APPROVER,
    Role.KUBERNATES,
    Role.KUBERNATES_APPROVER,
  )
  findAssignees(): Promise<ValueListItemResponse[]> {
    return this.searchForValueListsService.findAssignees();
  }

  // Only the database forms use it: same roles that can create database tickets.
  @ApiFindDatabaseDeployments()
  @Get('database-deployments')
  @Roles(Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER)
  findDatabaseDeployments(
    @Query() dto: FindDatabaseDeploymentsDto,
  ): Promise<ValueListItemResponse[]> {
    return this.searchForValueListsService.findDatabaseDeployments(dto);
  }

  @ApiFindDatabaseNames()
  @Get('database-names')
  @Roles(Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER)
  findDatabaseNames(
    @Query() dto: FindDatabaseNamesDto,
  ): Promise<ValueListItemResponse[]> {
    return this.searchForValueListsService.findDatabaseNames(dto);
  }
}
