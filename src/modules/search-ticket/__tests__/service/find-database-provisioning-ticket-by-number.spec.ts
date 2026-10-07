import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { SearchTicketService } from '../../search-ticket.service';

// @nestjs/typeorm is ESM-only and Jest runs as CommonJS. The code under test is
// built by hand below, so the injection decorator can be a no-op.
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

type RepositoryMock = {
  findAll: jest.Mock<() => Promise<unknown[]>>;
  findByNumber: jest.Mock<(number: number) => Promise<unknown>>;
};

function buildRepository(): RepositoryMock {
  return {
    findAll: jest.fn<() => Promise<unknown[]>>(),
    findByNumber: jest.fn<(number: number) => Promise<unknown>>(),
  };
}

describe('SearchTicketService.findDatabaseProvisioningTicketByNumber', () => {
  let target: RepositoryMock;
  let others: RepositoryMock[];
  let service: SearchTicketService;

  beforeEach(() => {
    const repositories = {
      dbm: buildRepository(),
      dbp: buildRepository(),
      srv: buildRepository(),
      kmf: buildRepository(),
      kub: buildRepository(),
    };
    target = repositories.dbp;
    others = [
      repositories.dbm,
      repositories.srv,
      repositories.kmf,
      repositories.kub,
    ];
    service = new SearchTicketService(
      repositories.dbm as never,
      repositories.dbp as never,
      repositories.srv as never,
      repositories.kmf as never,
      repositories.kub as never,
    );
  });

  it('looks the ticket up by number in its repository and returns it', async () => {
    const ticket = { id: 1, number: 42 };
    target.findByNumber.mockResolvedValue(ticket);

    await expect(
      service.findDatabaseProvisioningTicketByNumber(42),
    ).resolves.toBe(ticket);

    expect(target.findByNumber).toHaveBeenCalledTimes(1);
    expect(target.findByNumber).toHaveBeenCalledWith(42);
  });

  it('throws NotFoundException when the repository finds nothing', async () => {
    target.findByNumber.mockResolvedValue(null);

    await expect(
      service.findDatabaseProvisioningTicketByNumber(42),
    ).rejects.toThrow(NotFoundException);
  });

  it('reports the type and the number in the not-found message', async () => {
    target.findByNumber.mockResolvedValue(null);

    await expect(
      service.findDatabaseProvisioningTicketByNumber(42),
    ).rejects.toThrow('Database provisioning ticket with number 42 not found');
  });

  it('does not use any other repository', async () => {
    target.findByNumber.mockResolvedValue({ id: 1, number: 42 });

    await service.findDatabaseProvisioningTicketByNumber(42);

    others.forEach((mock) => {
      expect(mock.findAll).not.toHaveBeenCalled();
      expect(mock.findByNumber).not.toHaveBeenCalled();
    });
  });

  it('does not list every ticket to find one', async () => {
    target.findByNumber.mockResolvedValue({ id: 1, number: 42 });

    await service.findDatabaseProvisioningTicketByNumber(42);

    expect(target.findAll).not.toHaveBeenCalled();
  });

  it('propagates a repository rejection', async () => {
    const failure = new Error('database unavailable');
    target.findByNumber.mockRejectedValue(failure);

    await expect(
      service.findDatabaseProvisioningTicketByNumber(42),
    ).rejects.toBe(failure);
  });
});
