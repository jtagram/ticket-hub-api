import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SearchForValueListsService } from '../../search-for-value-lists.service';

// The services reach ESM-only packages (@nestjs/axios, @nestjs/config).
jest.mock('@nestjs/axios', () => ({ HttpService: class HttpService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

describe('SearchForValueListsService.findAssignees', () => {
  let iam: {
    findInternalUsersByRole: jest.Mock<
      (...args: unknown[]) => Promise<unknown>
    >;
  };
  let infra: {
    listDeployments: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
    listDatabases: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  };
  let config: { get: jest.Mock<(key: string) => unknown> };
  let service: SearchForValueListsService;

  beforeEach(() => {
    iam = {
      findInternalUsersByRole:
        jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    infra = {
      listDeployments: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
      listDatabases: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    config = { get: jest.fn<(key: string) => unknown>() };
    config.get.mockReturnValue('ticket-hub');
    service = new SearchForValueListsService(
      iam as never,
      infra as never,
      config as never,
    );
  });

  it('asks iam-api for the users of the configured application', async () => {
    iam.findInternalUsersByRole.mockResolvedValue([]);

    await service.findAssignees();

    expect(config.get).toHaveBeenCalledWith('TICKET_HUB_API_APPLICATION_NAME');
    expect(iam.findInternalUsersByRole).toHaveBeenCalledTimes(1);
    expect(iam.findInternalUsersByRole.mock.calls[0][0]).toBe('ticket-hub');
  });

  it('asks for ADMIN and every domain approver role, in that order', async () => {
    iam.findInternalUsersByRole.mockResolvedValue([]);

    await service.findAssignees();

    expect(iam.findInternalUsersByRole.mock.calls[0][1]).toEqual([
      'ADMIN',
      'DATABASE_APPROVER',
      'SERVER_APPROVER',
      'KUBERNATES_APPROVER',
    ]);
  });

  it('does not ask for the non-approver domain roles nor COMMON_USER', async () => {
    iam.findInternalUsersByRole.mockResolvedValue([]);

    await service.findAssignees();

    const roles = iam.findInternalUsersByRole.mock.calls[0][1] as string[];
    expect(roles).not.toContain('DATABASE');
    expect(roles).not.toContain('SERVER');
    expect(roles).not.toContain('KUBERNATES');
    expect(roles).not.toContain('COMMON_USER');
  });

  it('maps every user to a value-label pair using the email and the full name', async () => {
    iam.findInternalUsersByRole.mockResolvedValue([
      { id: 1, name: 'Ada', lastname: 'Lovelace', email: 'ada@example.com' },
      { id: 2, name: 'Alan', lastname: 'Turing', email: 'alan@example.com' },
    ]);

    await expect(service.findAssignees()).resolves.toEqual([
      {
        value: 'ada@example.com',
        label: 'Ada Lovelace (ada@example.com)',
      },
      {
        value: 'alan@example.com',
        label: 'Alan Turing (alan@example.com)',
      },
    ]);
  });

  it('keeps the order returned by iam-api', async () => {
    iam.findInternalUsersByRole.mockResolvedValue([
      { id: 9, name: 'Zed', lastname: 'Z', email: 'z@example.com' },
      { id: 1, name: 'Amy', lastname: 'A', email: 'a@example.com' },
    ]);

    const result = await service.findAssignees();

    expect(result.map((item) => item.value)).toEqual([
      'z@example.com',
      'a@example.com',
    ]);
  });

  it('returns an empty list when iam-api finds no users', async () => {
    iam.findInternalUsersByRole.mockResolvedValue([]);

    await expect(service.findAssignees()).resolves.toEqual([]);
  });

  it('does not call infra-hub-api', async () => {
    iam.findInternalUsersByRole.mockResolvedValue([]);

    await service.findAssignees();

    expect(infra.listDeployments).not.toHaveBeenCalled();
    expect(infra.listDatabases).not.toHaveBeenCalled();
  });

  it('propagates an iam-api failure', async () => {
    const failure = new Error('iam-api down');
    iam.findInternalUsersByRole.mockRejectedValue(failure);

    await expect(service.findAssignees()).rejects.toBe(failure);
  });
});
