import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { SearchForValueListsService } from '../../search-for-value-lists.service';

// The services reach ESM-only packages (@nestjs/axios, @nestjs/config).
jest.mock('@nestjs/axios', () => ({ HttpService: class HttpService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

describe('SearchForValueListsService.findDatabaseDeployments', () => {
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

  it('asks infra-hub-api for the deployments of the given namespace', async () => {
    infra.listDeployments.mockResolvedValue({ deployments: [] });

    await service.findDatabaseDeployments({ namespace: 'prod' });

    expect(infra.listDeployments).toHaveBeenCalledTimes(1);
    expect(infra.listDeployments).toHaveBeenCalledWith('prod');
  });

  it('maps every deployment name to a value-label pair with the same text', async () => {
    infra.listDeployments.mockResolvedValue({
      deployments: ['postgres-main', 'postgres-replica'],
    });

    await expect(
      service.findDatabaseDeployments({ namespace: 'prod' }),
    ).resolves.toEqual([
      { value: 'postgres-main', label: 'postgres-main' },
      { value: 'postgres-replica', label: 'postgres-replica' },
    ]);
  });

  it('returns an empty list when the namespace has no deployments', async () => {
    infra.listDeployments.mockResolvedValue({ deployments: [] });

    await expect(
      service.findDatabaseDeployments({ namespace: 'empty' }),
    ).resolves.toEqual([]);
  });

  it('does not call iam-api nor list databases', async () => {
    infra.listDeployments.mockResolvedValue({ deployments: [] });

    await service.findDatabaseDeployments({ namespace: 'prod' });

    expect(iam.findInternalUsersByRole).not.toHaveBeenCalled();
    expect(infra.listDatabases).not.toHaveBeenCalled();
  });

  it('propagates an infra-hub-api failure', async () => {
    const failure = new Error('infra-hub-api down');
    infra.listDeployments.mockRejectedValue(failure);

    await expect(
      service.findDatabaseDeployments({ namespace: 'prod' }),
    ).rejects.toBe(failure);
  });
});
