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

describe('SearchForValueListsController.findAssignees', () => {
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
    service.findAssignees.mockResolvedValue(items);

    await expect(controller.findAssignees()).resolves.toBe(items);

    expect(service.findAssignees).toHaveBeenCalledTimes(1);
    expect(service.findAssignees).toHaveBeenCalledWith();
  });

  it('does not call any other service method', async () => {
    service.findAssignees.mockResolvedValue([]);

    await controller.findAssignees();

    Object.entries(service)
      .filter(([name]) => name !== 'findAssignees')
      .forEach(([, mock]) => expect(mock).not.toHaveBeenCalled());
  });

  it('propagates a service rejection', async () => {
    const failure = new Error('boom');
    service.findAssignees.mockRejectedValue(failure);

    await expect(controller.findAssignees()).rejects.toBe(failure);
  });

  it('is routed as GET /search-for-value-lists/assignees', () => {
    const handler = SearchForValueListsController.prototype.findAssignees;

    expect(
      Reflect.getMetadata(PATH_METADATA, SearchForValueListsController),
    ).toBe('search-for-value-lists');
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('assignees');
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.GET,
    );
  });

  it('restricts access to the roles allowed to use the ticket forms', () => {
    const roles = new Reflector().get(
      ROLES_KEY,
      SearchForValueListsController.prototype.findAssignees,
    );

    expect(roles).toEqual([
      Role.ADMIN,
      Role.DATABASE,
      Role.DATABASE_APPROVER,
      Role.SERVER,
      Role.SERVER_APPROVER,
      Role.KUBERNATES,
      Role.KUBERNATES_APPROVER,
    ]);
  });

  it('never allows COMMON_USER', () => {
    const roles = new Reflector().get(
      ROLES_KEY,
      SearchForValueListsController.prototype.findAssignees,
    );

    expect(roles).not.toContain(Role.COMMON_USER);
  });
});
