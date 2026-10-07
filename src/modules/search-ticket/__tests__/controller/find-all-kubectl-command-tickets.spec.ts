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

describe('SearchTicketController.findAllKubectlCommandTickets', () => {
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
    service.findAllKubectlCommandTickets.mockResolvedValue(tickets);

    await expect(controller.findAllKubectlCommandTickets()).resolves.toBe(
      tickets,
    );

    expect(service.findAllKubectlCommandTickets).toHaveBeenCalledTimes(1);
    expect(service.findAllKubectlCommandTickets).toHaveBeenCalledWith();
  });

  it('does not call any other service method', async () => {
    service.findAllKubectlCommandTickets.mockResolvedValue([]);

    await controller.findAllKubectlCommandTickets();

    Object.entries(service)
      .filter(([name]) => name !== 'findAllKubectlCommandTickets')
      .forEach(([, mock]) => expect(mock).not.toHaveBeenCalled());
  });

  it('propagates a service rejection', async () => {
    const failure = new Error('boom');
    service.findAllKubectlCommandTickets.mockRejectedValue(failure);

    await expect(controller.findAllKubectlCommandTickets()).rejects.toBe(
      failure,
    );
  });

  it('is routed as GET /tickets/kubernetes/kubectl', () => {
    const handler =
      SearchTicketController.prototype.findAllKubectlCommandTickets;

    expect(Reflect.getMetadata(PATH_METADATA, SearchTicketController)).toBe(
      'tickets',
    );
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      'kubernetes/kubectl',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.GET,
    );
  });

  it('is restricted to the roles ADMIN, KUBERNATES, KUBERNATES_APPROVER', () => {
    const roles = new Reflector().get(
      ROLES_KEY,
      SearchTicketController.prototype.findAllKubectlCommandTickets,
    );

    expect(roles).toEqual([
      Role.ADMIN,
      Role.KUBERNATES,
      Role.KUBERNATES_APPROVER,
    ]);
  });
});
