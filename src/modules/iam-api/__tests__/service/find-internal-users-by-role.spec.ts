import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { IamApiConnector } from '../../iam-api.connector';
import { IamApiService } from '../../iam-api.service';

// The connector module reaches ESM-only packages (@nestjs/axios, @nestjs/config).
jest.mock('@nestjs/axios', () => ({ HttpService: class HttpService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

describe('IamApiService.findInternalUsersByRole', () => {
  let connector: {
    findInternalUsersByRole: jest.Mock<
      (...args: unknown[]) => Promise<unknown>
    >;
  };
  let service: IamApiService;

  beforeEach(() => {
    connector = {
      findInternalUsersByRole:
        jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    service = new IamApiService(connector as unknown as IamApiConnector);
  });

  it('delegates to the connector with the same arguments', async () => {
    connector.findInternalUsersByRole.mockResolvedValue([]);

    await service.findInternalUsersByRole('ticket-hub', ['ADMIN', 'SERVER']);

    expect(connector.findInternalUsersByRole).toHaveBeenCalledTimes(1);
    expect(connector.findInternalUsersByRole).toHaveBeenCalledWith(
      'ticket-hub',
      ['ADMIN', 'SERVER'],
    );
  });

  it('returns what the connector returns', async () => {
    const users = [{ id: 1, name: 'Ada', lastname: 'L', email: 'a@x.com' }];
    connector.findInternalUsersByRole.mockResolvedValue(users);

    await expect(
      service.findInternalUsersByRole('ticket-hub', ['ADMIN']),
    ).resolves.toBe(users);
  });

  it('propagates a connector failure', async () => {
    const failure = new Error('iam-api down');
    connector.findInternalUsersByRole.mockRejectedValue(failure);

    await expect(
      service.findInternalUsersByRole('ticket-hub', ['ADMIN']),
    ).rejects.toBe(failure);
  });
});
