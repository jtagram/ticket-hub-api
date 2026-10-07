import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Role } from '../../../../common/roles/role.enum';
import { ROLES_KEY } from '../../../../common/guards/roles.decorator';
import { SearchForValueListsController } from '../../search-for-value-lists.controller';
import { SearchForValueListsService } from '../../search-for-value-lists.service';

// The service reaches ESM-only packages (@nestjs/axios, @nestjs/config).
jest.mock('@nestjs/axios', () => ({ HttpService: class HttpService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

type ServiceMethod = jest.Mock<(...args: unknown[]) => Promise<unknown>>;

const dto = { namespace: 'prod', deployment: 'postgres-main' };

describe('SearchForValueListsController.findDatabaseNames', () => {
  let service: Record<string, ServiceMethod>;
  let controller: SearchForValueListsController;

  beforeEach(() => {
    service = {
      findAssignees: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      findDatabaseDeployments:
        jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      findDatabaseNames: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    controller = new SearchForValueListsController(
      service as unknown as SearchForValueListsService,
    );
  });

  it('delegates to the matching service method and returns its result', async () => {
    const items = [{ value: 'a', label: 'a' }];
    service.findDatabaseNames.mockResolvedValue(items);

    await expect(controller.findDatabaseNames(dto)).resolves.toBe(items);

    expect(service.findDatabaseNames).toHaveBeenCalledTimes(1);
    expect(service.findDatabaseNames).toHaveBeenCalledWith(dto);
  });

  it('does not call any other service method', async () => {
    service.findDatabaseNames.mockResolvedValue([]);

    await controller.findDatabaseNames(dto);

    Object.entries(service)
      .filter(([name]) => name !== 'findDatabaseNames')
      .forEach(([, mock]) => expect(mock).not.toHaveBeenCalled());
  });

  it('propagates a service rejection', async () => {
    const failure = new Error('boom');
    service.findDatabaseNames.mockRejectedValue(failure);

    await expect(controller.findDatabaseNames(dto)).rejects.toBe(failure);
  });

  it('is routed as GET /search-for-value-lists/database-names', () => {
    const handler = SearchForValueListsController.prototype.findDatabaseNames;

    expect(
      Reflect.getMetadata(PATH_METADATA, SearchForValueListsController),
    ).toBe('search-for-value-lists');
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('database-names');
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.GET,
    );
  });

  it('restricts access to the roles allowed to use the ticket forms', () => {
    const roles = new Reflector().get(
      ROLES_KEY,
      SearchForValueListsController.prototype.findDatabaseNames,
    );

    expect(roles).toEqual([Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER]);
  });

  it('never allows COMMON_USER', () => {
    const roles = new Reflector().get(
      ROLES_KEY,
      SearchForValueListsController.prototype.findDatabaseNames,
    );

    expect(roles).not.toContain(Role.COMMON_USER);
  });
});
