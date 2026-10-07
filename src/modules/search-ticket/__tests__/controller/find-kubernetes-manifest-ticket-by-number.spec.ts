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

describe('SearchTicketController.findKubernetesManifestTicketByNumber', () => {
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

  it('passes the number to the matching service method and returns its result', async () => {
    const ticket = { id: 1, number: 42 };
    service.findKubernetesManifestTicketByNumber.mockResolvedValue(ticket);

    await expect(
      controller.findKubernetesManifestTicketByNumber(42),
    ).resolves.toBe(ticket);

    expect(service.findKubernetesManifestTicketByNumber).toHaveBeenCalledTimes(
      1,
    );
    expect(service.findKubernetesManifestTicketByNumber).toHaveBeenCalledWith(
      42,
    );
  });

  it('does not call any other service method', async () => {
    service.findKubernetesManifestTicketByNumber.mockResolvedValue({});

    await controller.findKubernetesManifestTicketByNumber(42);

    Object.entries(service)
      .filter(([name]) => name !== 'findKubernetesManifestTicketByNumber')
      .forEach(([, mock]) => expect(mock).not.toHaveBeenCalled());
  });

  it('propagates the NotFoundException raised by the service', async () => {
    const failure = new NotFoundException('not found');
    service.findKubernetesManifestTicketByNumber.mockRejectedValue(failure);

    await expect(
      controller.findKubernetesManifestTicketByNumber(42),
    ).rejects.toBe(failure);
  });

  it('propagates an unexpected service rejection', async () => {
    const failure = new Error('boom');
    service.findKubernetesManifestTicketByNumber.mockRejectedValue(failure);

    await expect(
      controller.findKubernetesManifestTicketByNumber(42),
    ).rejects.toBe(failure);
  });

  it('is routed as GET /tickets/kubernetes/manifest/:number', () => {
    const handler =
      SearchTicketController.prototype.findKubernetesManifestTicketByNumber;

    expect(Reflect.getMetadata(PATH_METADATA, SearchTicketController)).toBe(
      'tickets',
    );
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      'kubernetes/manifest/:number',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.GET,
    );
  });

  it('parses the number path param with ParseIntPipe', () => {
    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      SearchTicketController,
      'findKubernetesManifestTicketByNumber',
    ) as Record<string, { data: string; pipes: unknown[] }>;
    const params = Object.values(metadata);

    expect(params).toHaveLength(1);
    expect(params[0].data).toBe('number');
    expect(params[0].pipes).toEqual([ParseIntPipe]);
  });

  it('is restricted to the roles ADMIN, KUBERNATES, KUBERNATES_APPROVER', () => {
    const roles = new Reflector().get(
      ROLES_KEY,
      SearchTicketController.prototype.findKubernetesManifestTicketByNumber,
    );

    expect(roles).toEqual([
      Role.ADMIN,
      Role.KUBERNATES,
      Role.KUBERNATES_APPROVER,
    ]);
  });
});
