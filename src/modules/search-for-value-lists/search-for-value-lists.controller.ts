import { Controller, Get, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
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
  findAssignees(@Req() request: Request): Promise<ValueListItemResponse[]> {
    const token = extractBearerToken(request);
    return this.searchForValueListsService.findAssignees(token);
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

/**
 * Same extraction criteria as `extractBearerToken` in jwt-auth.guard.ts.
 * The global `JwtAuthGuard` already validated this header before this
 * handler runs, so a well-formed bearer token is guaranteed to be present.
 */
function extractBearerToken(request: Request): string {
  const header = request.headers.authorization;
  const [type, token] = (header ?? '').split(' ');
  return type === 'Bearer' ? token : '';
}
