import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { defer, of, throwError } from 'rxjs';
import { AppUserAuthService } from '../app-user-auth.service';

// @nestjs/axios and @nestjs/config are ESM-only and Jest runs as CommonJS.
// The service is built by hand below, so only the class tokens must exist.
jest.mock('@nestjs/axios', () => ({ HttpService: class HttpService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

const IAM_API_URL = 'http://iam-api:3002';
const NOW_MS = 1_700_000_000_000;
const MARGIN_MS = 60 * 1000;

const config: Record<string, string> = {
  IAM_API_URL,
  TICKET_HUB_API_APPLICATION_NAME: 'ticket-hub',
  TICKET_HUB_API_SERVICE_CLIENT_ID: 'service-id',
  TICKET_HUB_API_SERVICE_CLIENT_SECRET: 'service-secret',
};

const buildJwt = (expMs: number | undefined, extra = 'x'): string => {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const payload = expMs === undefined ? {} : { exp: Math.floor(expMs / 1000) };
  return `${encode({ alg: 'RS256' })}.${encode({ ...payload, extra })}.sig`;
};

describe('AppUserAuthService.getAccessToken', () => {
  let post: jest.Mock;
  let service: AppUserAuthService;
  let now: number;

  beforeEach(() => {
    now = NOW_MS;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    post = jest.fn();
    const httpService = { post };
    const configService = { get: jest.fn((key: string) => config[key]) };
    service = new AppUserAuthService(
      httpService as unknown as HttpService,
      configService as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs in against iam-api apps-users endpoint with the service credentials', async () => {
    const token = buildJwt(NOW_MS + 3_600_000);
    post.mockReturnValue(of({ data: { access_token: token } }));

    await service.getAccessToken('infra-hub');

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      `${IAM_API_URL}/apps-users/login`,
      { clienteId: 'service-id', clienteSecret: 'service-secret' },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-application-name': 'ticket-hub',
          'x-target-application': 'infra-hub',
        },
      },
    );
  });

  it('returns the access token issued by iam-api', async () => {
    const token = buildJwt(NOW_MS + 3_600_000);
    post.mockReturnValue(of({ data: { access_token: token } }));

    await expect(service.getAccessToken('infra-hub')).resolves.toBe(token);
  });

  it('reuses the cached token while it is still valid', async () => {
    post.mockReturnValue(
      of({ data: { access_token: buildJwt(NOW_MS + 3_600_000) } }),
    );

    const first = await service.getAccessToken('infra-hub');
    const second = await service.getAccessToken('infra-hub');

    expect(second).toBe(first);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('keeps one cached token per target application', async () => {
    post
      .mockReturnValueOnce(
        of({ data: { access_token: buildJwt(NOW_MS + 3_600_000, 'a') } }),
      )
      .mockReturnValueOnce(
        of({ data: { access_token: buildJwt(NOW_MS + 3_600_000, 'b') } }),
      );

    const infra = await service.getAccessToken('infra-hub');
    const iam = await service.getAccessToken('iam');

    expect(infra).not.toBe(iam);
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1][2]).toMatchObject({
      headers: { 'x-target-application': 'iam' },
    });
    await expect(service.getAccessToken('infra-hub')).resolves.toBe(infra);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('logs in again when the token is inside the 60 seconds safety margin', async () => {
    post
      .mockReturnValueOnce(
        of({ data: { access_token: buildJwt(NOW_MS + 3_600_000, 'old') } }),
      )
      .mockReturnValueOnce(
        of({ data: { access_token: buildJwt(NOW_MS + 7_200_000, 'new') } }),
      );

    await service.getAccessToken('infra-hub');
    now = NOW_MS + 3_600_000 - MARGIN_MS;
    const refreshed = await service.getAccessToken('infra-hub');

    expect(post).toHaveBeenCalledTimes(2);
    expect(refreshed).toBe(buildJwt(NOW_MS + 7_200_000, 'new'));
  });

  it('still reuses the token one millisecond before the safety margin', async () => {
    post.mockReturnValue(
      of({ data: { access_token: buildJwt(NOW_MS + 3_600_000) } }),
    );

    await service.getAccessToken('infra-hub');
    now = NOW_MS + 3_600_000 - MARGIN_MS - 1;
    await service.getAccessToken('infra-hub');

    expect(post).toHaveBeenCalledTimes(1);
  });

  it('throws when the response has no access_token', async () => {
    post.mockReturnValue(of({ data: {} }));

    await expect(service.getAccessToken('infra-hub')).rejects.toThrow(
      'Failed to log in against iam-api as the ticket-hub-api service app-user for application "infra-hub": missing or empty "access_token" field',
    );
  });

  it('throws when the response body is missing', async () => {
    post.mockReturnValue(of({ data: undefined }));

    await expect(service.getAccessToken('infra-hub')).rejects.toThrow(
      'missing or empty "access_token"',
    );
  });

  it('throws when the access_token is blank', async () => {
    post.mockReturnValue(of({ data: { access_token: '   ' } }));

    await expect(service.getAccessToken('infra-hub')).rejects.toThrow(
      'missing or empty "access_token"',
    );
  });

  it('throws when the access_token is not a string', async () => {
    post.mockReturnValue(of({ data: { access_token: 123 } }));

    await expect(service.getAccessToken('infra-hub')).rejects.toThrow(
      'missing or empty "access_token"',
    );
  });

  it('throws when the token is not a JWT with a payload part', async () => {
    post.mockReturnValue(of({ data: { access_token: 'not-a-jwt' } }));

    await expect(service.getAccessToken('infra-hub')).rejects.toThrow(
      'Failed to decode JWT: malformed token',
    );
  });

  it('throws when the JWT payload has no exp claim', async () => {
    post.mockReturnValue(of({ data: { access_token: buildJwt(undefined) } }));

    await expect(service.getAccessToken('infra-hub')).rejects.toThrow(
      'Failed to decode JWT: missing "exp" claim',
    );
  });

  it('does not cache a token whose exp could not be decoded', async () => {
    post
      .mockReturnValueOnce(of({ data: { access_token: 'not-a-jwt' } }))
      .mockReturnValueOnce(
        of({ data: { access_token: buildJwt(NOW_MS + 3_600_000) } }),
      );

    await expect(service.getAccessToken('infra-hub')).rejects.toThrow();
    await expect(service.getAccessToken('infra-hub')).resolves.toBeDefined();

    expect(post).toHaveBeenCalledTimes(2);
  });

  it('propagates an HTTP failure from iam-api', async () => {
    const failure = new Error('401 Unauthorized');
    post.mockReturnValue(throwError(() => failure));

    await expect(service.getAccessToken('infra-hub')).rejects.toBe(failure);
  });

  describe('concurrent calls', () => {
    function deferredLogin() {
      let resolve!: (token: string) => void;
      let reject!: (error: Error) => void;
      const pending = new Promise<string>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return {
        resolve,
        reject,
        observable: defer(async () => ({
          data: { access_token: await pending },
        })),
      };
    }

    it('shares a single login between concurrent calls for the same application', async () => {
      const token = buildJwt(NOW_MS + 3_600_000);
      const login = deferredLogin();
      post.mockReturnValue(login.observable);

      const calls = [
        service.getAccessToken('infra-hub'),
        service.getAccessToken('infra-hub'),
        service.getAccessToken('infra-hub'),
      ];
      login.resolve(token);

      await expect(Promise.all(calls)).resolves.toEqual([token, token, token]);
      expect(post).toHaveBeenCalledTimes(1);
    });

    it('does not share logins between different applications', async () => {
      const infraToken = buildJwt(NOW_MS + 3_600_000, 'infra');
      const iamToken = buildJwt(NOW_MS + 3_600_000, 'iam');
      post.mockImplementation(
        (
          _url: string,
          _body: unknown,
          options: { headers: Record<string, string> },
        ) =>
          of({
            data: {
              access_token:
                options.headers['x-target-application'] === 'infra-hub'
                  ? infraToken
                  : iamToken,
            },
          }),
      );

      const [infra, iam] = await Promise.all([
        service.getAccessToken('infra-hub'),
        service.getAccessToken('iam'),
      ]);

      expect(infra).toBe(infraToken);
      expect(iam).toBe(iamToken);
      expect(post).toHaveBeenCalledTimes(2);
    });

    it('rejects every concurrent caller when the shared login fails', async () => {
      const failure = new Error('iam-api unavailable');
      const login = deferredLogin();
      post.mockReturnValue(login.observable);

      const calls = [
        service.getAccessToken('infra-hub'),
        service.getAccessToken('infra-hub'),
      ];
      login.reject(failure);

      await expect(calls[0]).rejects.toBe(failure);
      await expect(calls[1]).rejects.toBe(failure);
      expect(post).toHaveBeenCalledTimes(1);
    });

    it('does not cache the failure: the next call logs in again', async () => {
      const token = buildJwt(NOW_MS + 3_600_000);
      post.mockReturnValueOnce(throwError(() => new Error('boom')));
      post.mockReturnValueOnce(of({ data: { access_token: token } }));

      await expect(service.getAccessToken('infra-hub')).rejects.toThrow('boom');
      await expect(service.getAccessToken('infra-hub')).resolves.toBe(token);

      expect(post).toHaveBeenCalledTimes(2);
    });

    it('removes the in-flight entry once the login succeeded and serves the cache afterwards', async () => {
      const token = buildJwt(NOW_MS + 3_600_000);
      post.mockReturnValue(of({ data: { access_token: token } }));

      await Promise.all([
        service.getAccessToken('infra-hub'),
        service.getAccessToken('infra-hub'),
      ]);
      await service.getAccessToken('infra-hub');

      expect(post).toHaveBeenCalledTimes(1);
    });

    it('starts a new login when the cached token expired after a shared one settled', async () => {
      post.mockReturnValueOnce(
        of({
          data: { access_token: buildJwt(NOW_MS + MARGIN_MS + 1000, 'a') },
        }),
      );
      post.mockReturnValueOnce(
        of({ data: { access_token: buildJwt(NOW_MS + 3_600_000, 'b') } }),
      );

      await service.getAccessToken('infra-hub');
      now += 5000;
      await service.getAccessToken('infra-hub');

      expect(post).toHaveBeenCalledTimes(2);
    });
  });
});
