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

describe('InfraHubApiConnector.manageServerCommand', () => {
  let post: jest.Mock;
  let getAccessToken: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  let connector: InfraHubApiConnector;

  beforeEach(() => {
    post = jest.fn();
    getAccessToken = jest
      .fn<(...args: unknown[]) => Promise<unknown>>()
      .mockResolvedValue('service-token');
    connector = new InfraHubApiConnector(
      { post } as unknown as HttpService,
      {
        get: jest.fn((key: string) => config[key]),
      } as unknown as ConfigService,
      { getAccessToken } as unknown as AppUserAuthService,
    );
  });

  const body = { numberOfTickets: 2, playbook: 'restart.yml' } as never;

  it('asks for a token of the infra-hub application', async () => {
    post.mockReturnValue(of({ data: {} }));

    await connector.manageServerCommand(body);

    expect(getAccessToken).toHaveBeenCalledWith(TARGET_APPLICATION);
  });

  it('POSTs to /server-hub-api/manage-server with the bearer token and the body', async () => {
    post.mockReturnValue(of({ data: {} }));

    await connector.manageServerCommand(body);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      `${BASE_URL}/server-hub-api/manage-server`,
      body,
      { headers: { Authorization: 'Bearer service-token' } },
    );
  });

  it('returns the response data', async () => {
    const data = { executionResult: { success: true }, logId: 'log-1' };
    post.mockReturnValue(of({ data }));

    await expect(connector.manageServerCommand(body)).resolves.toBe(data);
  });

  it('maps an infra-hub-api error response to an HttpException with the same status and body', async () => {
    const response = { status: 422, data: { message: 'invalid playbook' } };
    post.mockReturnValue(
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
      .manageServerCommand(body)
      .catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(HttpException);
    expect((failure as HttpException).getStatus()).toBe(422);
    expect((failure as HttpException).getResponse()).toEqual({
      message: 'invalid playbook',
    });
  });

  it('rethrows an axios error that has no response (network failure) untouched', async () => {
    const failure = new AxiosError('connect ECONNREFUSED', 'ECONNREFUSED');
    post.mockReturnValue(throwError(() => failure));

    await expect(connector.manageServerCommand(body)).rejects.toBe(failure);
  });

  it('rethrows a non-axios error untouched', async () => {
    const failure = new Error('boom');
    post.mockReturnValue(throwError(() => failure));

    await expect(connector.manageServerCommand(body)).rejects.toBe(failure);
  });

  it('propagates a token failure without calling infra-hub-api', async () => {
    const failure = new Error('login failed');
    getAccessToken.mockRejectedValue(failure);

    await expect(connector.manageServerCommand(body)).rejects.toBe(failure);
    expect(post).not.toHaveBeenCalled();
  });
});
