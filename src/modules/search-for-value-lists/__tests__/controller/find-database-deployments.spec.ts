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

const dto = { namespace: 'prod' };

describe('SearchForValueListsController.findDatabaseDeployments', () => {
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
    service.findDatabaseDeployments.mockResolvedValue(items);

    await expect(controller.findDatabaseDeployments(dto)).resolves.toBe(items);

    expect(service.findDatabaseDeployments).toHaveBeenCalledTimes(1);
    expect(service.findDatabaseDeployments).toHaveBeenCalledWith(dto);
  });

  it('does not call any other service method', async () => {
    service.findDatabaseDeployments.mockResolvedValue([]);

    await controller.findDatabaseDeployments(dto);

    Object.entries(service)
      .filter(([name]) => name !== 'findDatabaseDeployments')
      .forEach(([, mock]) => expect(mock).not.toHaveBeenCalled());
  });

  it('propagates a service rejection', async () => {
    const failure = new Error('boom');
    service.findDatabaseDeployments.mockRejectedValue(failure);

    await expect(controller.findDatabaseDeployments(dto)).rejects.toBe(failure);
  });

  it('is routed as GET /search-for-value-lists/database-deployments', () => {
    const handler =
      SearchForValueListsController.prototype.findDatabaseDeployments;

    expect(
      Reflect.getMetadata(PATH_METADATA, SearchForValueListsController),
    ).toBe('search-for-value-lists');
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      'database-deployments',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.GET,
    );
  });

  it('restricts access to the roles allowed to use the ticket forms', () => {
    const roles = new Reflector().get(
      ROLES_KEY,
      SearchForValueListsController.prototype.findDatabaseDeployments,
    );

    expect(roles).toEqual([Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER]);
  });

  it('never allows COMMON_USER', () => {
    const roles = new Reflector().get(
      ROLES_KEY,
      SearchForValueListsController.prototype.findDatabaseDeployments,
    );

    expect(roles).not.toContain(Role.COMMON_USER);
  });
});
