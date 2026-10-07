import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Request } from 'express';
import { CreateTicketController } from '../../create-ticket.controller';
import { CreateTicketService } from '../../create-ticket.service';

// @nestjs/typeorm is ESM-only and Jest runs as CommonJS. The controller is
// built by hand below, so the injection decorator can be a no-op.
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

type Dto = { informer: string };
type ServiceMethod = jest.Mock<(dto: Dto) => Promise<unknown>>;

function buildRequest(email: string): Request {
  return { user: { email } } as unknown as Request;
}

describe('CreateTicketController.createServerManagementTicket', () => {
  let target: ServiceMethod;
  let others: ServiceMethod[];
  let controller: CreateTicketController;

  beforeEach(() => {
    const buildMock = () => jest.fn<(dto: Dto) => Promise<unknown>>();
    target = buildMock();
    others = [buildMock(), buildMock(), buildMock(), buildMock()];
    const names = [
      'createDatabaseManagementTicket',
      'createDatabaseProvisioningTicket',
      'createServerManagementTicket',
      'createKubernetesManifestTicket',
      'createKubectlCommandTicket',
    ].filter((name) => name !== 'createServerManagementTicket');
    const service: Record<string, ServiceMethod> = {
      createServerManagementTicket: target,
    };
    names.forEach((name, index) => {
      service[name] = others[index];
    });
    controller = new CreateTicketController(
      service as unknown as CreateTicketService,
    );
  });

  it('overwrites the informer with the authenticated user email', async () => {
    const dto: Dto = { informer: 'spoofed@example.com' };
    target.mockResolvedValue({});

    await controller.createServerManagementTicket(
      dto as never,
      buildRequest('real@example.com'),
    );

    expect(target).toHaveBeenCalledTimes(1);
    expect(target).toHaveBeenCalledWith(dto);
    expect(dto.informer).toBe('real@example.com');
  });

  it('sets the informer when the body did not carry one', async () => {
    const dto = {} as Dto;
    target.mockResolvedValue({});

    await controller.createServerManagementTicket(
      dto as never,
      buildRequest('real@example.com'),
    );

    expect(dto.informer).toBe('real@example.com');
  });

  it('delegates to the matching service method and returns its result', async () => {
    const created = { id: 1, number: 10 };
    target.mockResolvedValue(created);

    await expect(
      controller.createServerManagementTicket(
        { informer: 'x@example.com' } as never,
        buildRequest('real@example.com'),
      ),
    ).resolves.toBe(created);

    others.forEach((mock) => expect(mock).not.toHaveBeenCalled());
  });

  it('propagates a service rejection', async () => {
    const failure = new Error('boom');
    target.mockRejectedValue(failure);

    await expect(
      controller.createServerManagementTicket(
        { informer: 'x@example.com' } as never,
        buildRequest('real@example.com'),
      ),
    ).rejects.toBe(failure);
  });
});
