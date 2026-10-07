import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { AxiosError } from 'axios';
import { of, throwError } from 'rxjs';
import { AppUserAuthService } from '../../../../common/iam-api-auth/app-user-auth.service';
import { InfraHubApiConnector } from '../../infra-hub-api.connector';

// @nestjs/axios and @nestjs/config are ESM-only and Jest runs as CommonJS.
// The connector is built by hand below, so only the class tokens must exist.
jest.mock('@nestjs/axios', () => ({ HttpService: class HttpService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

const BASE_URL = 'http://infra-hub-api:3001';
const TARGET_APPLICATION = 'infra-hub';
const config: Record<string, string> = {
  INFRA_HUB_API_URL: BASE_URL,
  INFRA_HUB_API_APPLICATION_NAME: TARGET_APPLICATION,
};

describe('InfraHubApiConnector.listDatabases', () => {
  let get: jest.Mock;
  let getAccessToken: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  let connector: InfraHubApiConnector;

  beforeEach(() => {
    get = jest.fn();
    getAccessToken = jest
      .fn<(...args: unknown[]) => Promise<unknown>>()
      .mockResolvedValue('service-token');
    connector = new InfraHubApiConnector(
      { get } as unknown as HttpService,
      {
        get: jest.fn((key: string) => config[key]),
      } as unknown as ConfigService,
      { getAccessToken } as unknown as AppUserAuthService,
    );
  });

  it('asks for a token of the infra-hub application', async () => {
    get.mockReturnValue(of({ data: {} }));

    await connector.listDatabases('dev', 'pg');

    expect(getAccessToken).toHaveBeenCalledWith(TARGET_APPLICATION);
  });

  it('GETs to /database-hub-api/list-databases with the bearer token and the query params', async () => {
    get.mockReturnValue(of({ data: {} }));

    await connector.listDatabases('dev', 'pg');

    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(
      `${BASE_URL}/database-hub-api/list-databases`,
      {
        params: { namespace: 'dev', deployment: 'pg' },
        headers: { Authorization: 'Bearer service-token' },
      },
    );
  });

  it('returns the response data', async () => {
    const data = { databases: ['app', 'audit'] };
    get.mockReturnValue(of({ data }));

    await expect(connector.listDatabases('dev', 'pg')).resolves.toBe(data);
  });

  it('maps an infra-hub-api error response to an HttpException with the same status and body', async () => {
    const response = { status: 422, data: { message: 'invalid playbook' } };
    get.mockReturnValue(
      throwError(
        () =>
          new AxiosError(
            'Request failed',
            'ERR_BAD_REQUEST',
            undefined,
            undefined,
            response as never,
          ),
      ),
    );

    const failure = await connector
      .listDatabases('dev', 'pg')
      .catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(HttpException);
    expect((failure as HttpException).getStatus()).toBe(422);
    expect((failure as HttpException).getResponse()).toEqual({
      message: 'invalid playbook',
    });
  });

  it('rethrows an axios error that has no response (network failure) untouched', async () => {
    const failure = new AxiosError('connect ECONNREFUSED', 'ECONNREFUSED');
    get.mockReturnValue(throwError(() => failure));

    await expect(connector.listDatabases('dev', 'pg')).rejects.toBe(failure);
  });

  it('rethrows a non-axios error untouched', async () => {
    const failure = new Error('boom');
    get.mockReturnValue(throwError(() => failure));

    await expect(connector.listDatabases('dev', 'pg')).rejects.toBe(failure);
  });

  it('propagates a token failure without calling infra-hub-api', async () => {
    const failure = new Error('login failed');
    getAccessToken.mockRejectedValue(failure);

    await expect(connector.listDatabases('dev', 'pg')).rejects.toBe(failure);
    expect(get).not.toHaveBeenCalled();
  });
});
