import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException, ParseIntPipe, RequestMethod } from '@nestjs/common';
import {
  METHOD_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../../common/guards/roles.decorator';
import { Role } from '../../../../common/roles/role.enum';
import { SearchTicketController } from '../../search-ticket.controller';
import { SearchTicketService } from '../../search-ticket.service';

// @nestjs/typeorm is ESM-only and Jest runs as CommonJS. The code under test is
// built by hand below, so the injection decorator can be a no-op.
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

type ServiceMethod = jest.Mock<(...args: unknown[]) => Promise<unknown>>;

function buildMock(): ServiceMethod {
  return jest.fn<(...args: unknown[]) => Promise<unknown>>();
}

describe('SearchTicketController.findAllServerManagementTickets', () => {
  let service: Record<string, ServiceMethod>;
  let controller: SearchTicketController;

  beforeEach(() => {
    service = {
      findAllDatabaseManagementTickets: buildMock(),
      findDatabaseManagementTicketByNumber: buildMock(),
      findAllDatabaseProvisioningTickets: buildMock(),
      findDatabaseProvisioningTicketByNumber: buildMock(),
      findAllServerManagementTickets: buildMock(),
      findServerManagementTicketByNumber: buildMock(),
      findAllKubernetesManifestTickets: buildMock(),
      findKubernetesManifestTicketByNumber: buildMock(),
      findAllKubectlCommandTickets: buildMock(),
      findKubectlCommandTicketByNumber: buildMock(),
    };
    controller = new SearchTicketController(
      service as unknown as SearchTicketService,
    );
  });

  it('delegates to the matching service method and returns its result', async () => {
    const tickets = [{ id: 1, number: 1 }];
    service.findAllServerManagementTickets.mockResolvedValue(tickets);

    await expect(controller.findAllServerManagementTickets()).resolves.toBe(
      tickets,
    );

    expect(service.findAllServerManagementTickets).toHaveBeenCalledTimes(1);
    expect(service.findAllServerManagementTickets).toHaveBeenCalledWith();
  });

  it('does not call any other service method', async () => {
    service.findAllServerManagementTickets.mockResolvedValue([]);

    await controller.findAllServerManagementTickets();

    Object.entries(service)
      .filter(([name]) => name !== 'findAllServerManagementTickets')
      .forEach(([, mock]) => expect(mock).not.toHaveBeenCalled());
  });

  it('propagates a service rejection', async () => {
    const failure = new Error('boom');
    service.findAllServerManagementTickets.mockRejectedValue(failure);

    await expect(controller.findAllServerManagementTickets()).rejects.toBe(
      failure,
    );
  });

  it('is routed as GET /tickets/server/management', () => {
    const handler =
      SearchTicketController.prototype.findAllServerManagementTickets;

    expect(Reflect.getMetadata(PATH_METADATA, SearchTicketController)).toBe(
      'tickets',
    );
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      'server/management',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.GET,
    );
  });

  it('is restricted to the roles ADMIN, SERVER, SERVER_APPROVER', () => {
    const roles = new Reflector().get(
      ROLES_KEY,
      SearchTicketController.prototype.findAllServerManagementTickets,
    );

    expect(roles).toEqual([Role.ADMIN, Role.SERVER, Role.SERVER_APPROVER]);
  });
});
