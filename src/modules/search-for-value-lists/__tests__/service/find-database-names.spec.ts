import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SearchForValueListsService } from '../../search-for-value-lists.service';

// The services reach ESM-only packages (@nestjs/axios, @nestjs/config).
jest.mock('@nestjs/axios', () => ({ HttpService: class HttpService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

describe('SearchForValueListsService.findDatabaseNames', () => {
  let iam: {
    findInternalUsersByRole: jest.Mock<
      (...args: unknown[]) => Promise<unknown>
    >;
  };
  let infra: {
    listDeployments: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
    listDatabases: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  };
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
    service = new SearchForValueListsService(
      iam as never,
      infra as never,
      { get: jest.fn() } as never,
    );
  });

  it('asks infra-hub-api for the databases of the given namespace and deployment', async () => {
    infra.listDatabases.mockResolvedValue({ databases: [] });

    await service.findDatabaseNames({
      namespace: 'prod',
      deployment: 'postgres-main',
    });

    expect(infra.listDatabases).toHaveBeenCalledTimes(1);
    expect(infra.listDatabases).toHaveBeenCalledWith('prod', 'postgres-main');
  });

  it('maps every database name to a value-label pair with the same text', async () => {
    infra.listDatabases.mockResolvedValue({ databases: ['orders', 'billing'] });

    await expect(
      service.findDatabaseNames({
        namespace: 'prod',
        deployment: 'postgres-main',
      }),
    ).resolves.toEqual([
      { value: 'orders', label: 'orders' },
      { value: 'billing', label: 'billing' },
    ]);
  });

  it('returns an empty list when the deployment has no databases', async () => {
    infra.listDatabases.mockResolvedValue({ databases: [] });

    await expect(
      service.findDatabaseNames({ namespace: 'prod', deployment: 'empty' }),
    ).resolves.toEqual([]);
  });

  it('does not call iam-api nor list deployments', async () => {
    infra.listDatabases.mockResolvedValue({ databases: [] });

    await service.findDatabaseNames({
      namespace: 'prod',
      deployment: 'postgres-main',
    });

    expect(iam.findInternalUsersByRole).not.toHaveBeenCalled();
    expect(infra.listDeployments).not.toHaveBeenCalled();
  });

  it('propagates an infra-hub-api failure', async () => {
    const failure = new Error('infra-hub-api down');
    infra.listDatabases.mockRejectedValue(failure);

    await expect(
      service.findDatabaseNames({
        namespace: 'prod',
        deployment: 'postgres-main',
      }),
    ).rejects.toBe(failure);
  });
});
