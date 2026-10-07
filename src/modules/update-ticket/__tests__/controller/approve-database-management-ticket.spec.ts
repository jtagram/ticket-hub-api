import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  ConflictException,
  NotFoundException,
  ParseIntPipe,
  RequestMethod,
} from '@nestjs/common';
import {
  METHOD_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../../common/guards/roles.decorator';
import { Role } from '../../../../common/roles/role.enum';
import { UpdateTicketController } from '../../update-ticket.controller';
import { UpdateTicketService } from '../../update-ticket.service';

// @nestjs/typeorm is ESM-only and Jest runs as CommonJS. The code under test is
// built by hand below, so the injection decorator can be a no-op.
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));
// The infra-hub-api connector reaches ESM-only packages (@nestjs/axios, @nestjs/config).
jest.mock('@nestjs/axios', () => ({ HttpService: class HttpService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

type ServiceMethod = jest.Mock<(...args: unknown[]) => Promise<unknown>>;

function buildMock(): ServiceMethod {
  return jest.fn<(...args: unknown[]) => Promise<unknown>>();
}

describe('UpdateTicketController.approveDatabaseManagementTicket', () => {
  let service: Record<string, ServiceMethod>;
  let controller: UpdateTicketController;

  beforeEach(() => {
    service = {
      approveDatabaseManagementTicket: buildMock(),
      rejectDatabaseManagementTicket: buildMock(),
      approveDatabaseProvisioningTicket: buildMock(),
      rejectDatabaseProvisioningTicket: buildMock(),
      approveServerManagementTicket: buildMock(),
      rejectServerManagementTicket: buildMock(),
      approveKubernetesManifestTicket: buildMock(),
      rejectKubernetesManifestTicket: buildMock(),
      approveKubectlCommandTicket: buildMock(),
      rejectKubectlCommandTicket: buildMock(),
    };
    controller = new UpdateTicketController(
      service as unknown as UpdateTicketService,
    );
  });

  it('passes the number to the matching service method and returns its result', async () => {
    const ticket = { id: 1, number: 42 };
    service.approveDatabaseManagementTicket.mockResolvedValue(ticket);

    await expect(controller.approveDatabaseManagementTicket(42)).resolves.toBe(
      ticket,
    );

    expect(service.approveDatabaseManagementTicket).toHaveBeenCalledTimes(1);
    expect(service.approveDatabaseManagementTicket).toHaveBeenCalledWith(42);
  });

  it('does not call any other service method', async () => {
    service.approveDatabaseManagementTicket.mockResolvedValue({});

    await controller.approveDatabaseManagementTicket(42);

    Object.entries(service)
      .filter(([name]) => name !== 'approveDatabaseManagementTicket')
      .forEach(([, mock]) => expect(mock).not.toHaveBeenCalled());
  });

  it('propagates the NotFoundException raised by the service', async () => {
    const failure = new NotFoundException('not found');
    service.approveDatabaseManagementTicket.mockRejectedValue(failure);

    await expect(controller.approveDatabaseManagementTicket(42)).rejects.toBe(
      failure,
    );
  });

  it('propagates the ConflictException raised by the service', async () => {
    const failure = new ConflictException('already handled');
    service.approveDatabaseManagementTicket.mockRejectedValue(failure);

    await expect(controller.approveDatabaseManagementTicket(42)).rejects.toBe(
      failure,
    );
  });

  it('is routed as PATCH /tickets/database/management/:number/approve', () => {
    const handler =
      UpdateTicketController.prototype.approveDatabaseManagementTicket;

    expect(Reflect.getMetadata(PATH_METADATA, UpdateTicketController)).toBe(
      'tickets',
    );
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      'database/management/:number/approve',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.PATCH,
    );
  });

  it('parses the number path param with ParseIntPipe', () => {
    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      UpdateTicketController,
      'approveDatabaseManagementTicket',
    ) as Record<string, { data: string; pipes: unknown[] }>;
    const params = Object.values(metadata);

    expect(params).toHaveLength(1);
    expect(params[0].data).toBe('number');
    expect(params[0].pipes).toEqual([ParseIntPipe]);
  });

  it('is restricted to the roles ADMIN, DATABASE_APPROVER', () => {
    const roles = new Reflector().get(
      ROLES_KEY,
      UpdateTicketController.prototype.approveDatabaseManagementTicket,
    );

    expect(roles).toEqual([Role.ADMIN, Role.DATABASE_APPROVER]);
  });
});
