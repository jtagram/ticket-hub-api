import { Controller, Get, Query } from '@nestjs/common';
import { SearchForValueListsService } from './search-for-value-lists.service';
import { FindDatabaseDeploymentsDto } from './dto/find-database-deployments.dto';
import { FindDatabaseNamesDto } from './dto/find-database-names.dto';
import { ValueListItemResponse } from './value-list-item.response';

@Controller('search-for-value-lists')
export class SearchForValueListsController {
  constructor(
    private readonly searchForValueListsService: SearchForValueListsService,
  ) {}

  @Get('assignees')
  findAssignees(): Promise<ValueListItemResponse[]> {
    return this.searchForValueListsService.findAssignees();
  }

  @Get('database-deployments')
  findDatabaseDeployments(
    @Query() dto: FindDatabaseDeploymentsDto,
  ): Promise<ValueListItemResponse[]> {
    return this.searchForValueListsService.findDatabaseDeployments(dto);
  }

  @Get('database-names')
  findDatabaseNames(
    @Query() dto: FindDatabaseNamesDto,
  ): Promise<ValueListItemResponse[]> {
    return this.searchForValueListsService.findDatabaseNames(dto);
  }
}
