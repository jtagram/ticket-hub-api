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

describe('SearchTicketService.findAllServerManagementTickets', () => {
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
    target = repositories.srv;
    others = [
      repositories.dbm,
      repositories.dbp,
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

  it('returns the list produced by its repository', async () => {
    const tickets = [
      { id: 1, number: 1 },
      { id: 2, number: 2 },
    ];
    target.findAll.mockResolvedValue(tickets);

    await expect(service.findAllServerManagementTickets()).resolves.toBe(
      tickets,
    );

    expect(target.findAll).toHaveBeenCalledTimes(1);
    expect(target.findAll).toHaveBeenCalledWith();
  });

  it('returns an empty list when the repository has no tickets', async () => {
    target.findAll.mockResolvedValue([]);

    await expect(service.findAllServerManagementTickets()).resolves.toEqual([]);
  });

  it('does not use any other repository', async () => {
    target.findAll.mockResolvedValue([]);

    await service.findAllServerManagementTickets();

    others.forEach((mock) => {
      expect(mock.findAll).not.toHaveBeenCalled();
      expect(mock.findByNumber).not.toHaveBeenCalled();
    });
  });

  it('does not look tickets up by number', async () => {
    target.findAll.mockResolvedValue([]);

    await service.findAllServerManagementTickets();

    expect(target.findByNumber).not.toHaveBeenCalled();
  });

  it('propagates a repository rejection', async () => {
    const failure = new Error('database unavailable');
    target.findAll.mockRejectedValue(failure);

    await expect(service.findAllServerManagementTickets()).rejects.toBe(
      failure,
    );
  });
});
