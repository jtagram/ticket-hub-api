import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AppUserAuthService } from '../../../../common/iam-api-auth/app-user-auth.service';
import { IamApiConnector } from '../../iam-api.connector';

// @nestjs/axios and @nestjs/config are ESM-only and Jest runs as CommonJS.
// The connector is built by hand below, so only the class tokens must exist.
jest.mock('@nestjs/axios', () => ({ HttpService: class HttpService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

const config: Record<string, string> = {
  IAM_API_URL: 'http://iam-api:3002',
  IAM_API_APPLICATION_NAME: 'iam',
};

describe('IamApiConnector.findInternalUsersByRole', () => {
  let get: jest.Mock;
  let getAccessToken: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  let connector: IamApiConnector;

  beforeEach(() => {
    get = jest.fn();
    getAccessToken = jest
      .fn<(...args: unknown[]) => Promise<unknown>>()
      .mockResolvedValue('service-token');
    connector = new IamApiConnector(
      { get } as unknown as HttpService,
      {
        get: jest.fn((key: string) => config[key]),
      } as unknown as ConfigService,
      { getAccessToken } as unknown as AppUserAuthService,
    );
  });

  it('asks for a token of the iam application', async () => {
    get.mockReturnValue(of({ data: [] }));

    await connector.findInternalUsersByRole('ticket-hub', ['ADMIN']);

    expect(getAccessToken).toHaveBeenCalledWith('iam');
  });

  it('GETs /internal-users/by-role with the bearer token', async () => {
    get.mockReturnValue(of({ data: [] }));

    await connector.findInternalUsersByRole('ticket-hub', ['ADMIN']);

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(
      'http://iam-api:3002/internal-users/by-role',
      {
        params: { applicationName: 'ticket-hub', roles: 'ADMIN' },
        headers: { Authorization: 'Bearer service-token' },
      },
    );
  });

  it('joins several roles with commas in the "roles" query param', async () => {
    get.mockReturnValue(of({ data: [] }));

    await connector.findInternalUsersByRole('ticket-hub', [
      'DATABASE',
      'DATABASE_APPROVER',
    ]);

    expect(get.mock.calls[0][1]).toMatchObject({
      params: { roles: 'DATABASE,DATABASE_APPROVER' },
    });
  });

  it('sends an empty "roles" param for an empty role list', async () => {
    get.mockReturnValue(of({ data: [] }));

    await connector.findInternalUsersByRole('ticket-hub', []);

    expect(get.mock.calls[0][1]).toMatchObject({ params: { roles: '' } });
  });

  it('returns the response data', async () => {
    const users = [{ id: 1, name: 'Ada', lastname: 'L', email: 'a@x.com' }];
    get.mockReturnValue(of({ data: users }));

    await expect(
      connector.findInternalUsersByRole('ticket-hub', ['ADMIN']),
    ).resolves.toBe(users);
  });

  it('propagates an HTTP failure untouched', async () => {
    const failure = new Error('500 from iam-api');
    get.mockReturnValue(throwError(() => failure));

    await expect(
      connector.findInternalUsersByRole('ticket-hub', ['ADMIN']),
    ).rejects.toBe(failure);
  });

  it('propagates a token failure without calling iam-api', async () => {
    const failure = new Error('login failed');
    getAccessToken.mockRejectedValue(failure);

    await expect(
      connector.findInternalUsersByRole('ticket-hub', ['ADMIN']),
    ).rejects.toBe(failure);
    expect(get).not.toHaveBeenCalled();
  });
});
