import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { generateKeyPairSync, JsonWebKey } from 'crypto';
import { Logger } from 'nestjs-pino';
import {
  JWKS_FETCH_TIMEOUT_MS,
  JwtPublicKeyService,
} from '../jwt-public-key.service';

// @nestjs/config is ESM-only and Jest runs as CommonJS. The service is built
// by hand below, so only the class token needs to exist.
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));
// @nestjs/schedule is ESM-only too; the @Interval scheduling is not under test.
jest.mock('@nestjs/schedule', () => ({ Interval: () => () => undefined }));

const IAM_API_URL = 'http://iam-api:3002';
const COOLDOWN_MS = 30 * 1000;

const buildJwk = (kid?: string): JsonWebKey & { kid?: string } => {
  const { publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = publicKey.export({ format: 'jwk' }) as JsonWebKey;
  return kid === undefined ? jwk : { ...jwk, kid };
};

const jwksResponse = (body: unknown, ok = true, status = 200) =>
  ({ ok, status, json: async () => body }) as unknown as Response;

describe('JwtPublicKeyService', () => {
  let fetchMock: jest.Mock<
    (url: string, init?: RequestInit) => Promise<Response>
  >;
  let logger: { error: jest.Mock };
  let configService: { get: jest.Mock };
  let service: JwtPublicKeyService;
  let now: number;

  beforeEach(() => {
    now = 1_000_000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    fetchMock =
      jest.fn<(url: string, init?: RequestInit) => Promise<Response>>();
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock as never);
    logger = { error: jest.fn() };
    configService = { get: jest.fn().mockReturnValue(IAM_API_URL) };
    service = new JwtPublicKeyService(
      configService as unknown as ConfigService,
      logger as unknown as Logger,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onModuleInit', () => {
    it('fetches the JWKS endpoint of iam-api', async () => {
      fetchMock.mockResolvedValue(jwksResponse({ keys: [buildJwk('k1')] }));

      await service.onModuleInit();

      expect(configService.get).toHaveBeenCalledWith('IAM_API_URL');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        `${IAM_API_URL}/.well-known/jwks.json`,
        { signal: expect.any(AbortSignal) },
      );
    });

    it('bounds the JWKS request with a timeout signal', async () => {
      const timeoutSignal = new AbortController().signal;
      const timeoutSpy = jest
        .spyOn(AbortSignal, 'timeout')
        .mockReturnValue(timeoutSignal);
      fetchMock.mockResolvedValue(jwksResponse({ keys: [buildJwk('k1')] }));

      await service.onModuleInit();

      expect(JWKS_FETCH_TIMEOUT_MS).toBe(5000);
      expect(timeoutSpy).toHaveBeenCalledWith(JWKS_FETCH_TIMEOUT_MS);
      expect(fetchMock).toHaveBeenCalledWith(expect.any(String), {
        signal: timeoutSignal,
      });
    });

    it('fails the boot when the request times out', async () => {
      fetchMock.mockRejectedValue(
        new DOMException('The operation timed out.', 'TimeoutError'),
      );

      await expect(service.onModuleInit()).rejects.toThrow(
        'The operation timed out.',
      );
    });

    it('fails the boot when the request is aborted', async () => {
      fetchMock.mockRejectedValue(
        new DOMException('This operation was aborted', 'AbortError'),
      );

      await expect(service.onModuleInit()).rejects.toThrow(
        'This operation was aborted',
      );
    });

    it('converts every JWK with a kid to a PEM public key', async () => {
      fetchMock.mockResolvedValue(
        jwksResponse({ keys: [buildJwk('k1'), buildJwk('k2')] }),
      );

      await service.onModuleInit();

      const first = await service.getPublicKey('k1');
      const second = await service.getPublicKey('k2');
      expect(first).toMatch(/^-----BEGIN PUBLIC KEY-----/);
      expect(second).toMatch(/^-----BEGIN PUBLIC KEY-----/);
      expect(first).not.toBe(second);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('ignores keys without a kid when at least one has it', async () => {
      fetchMock.mockResolvedValue(
        jwksResponse({ keys: [buildJwk(), buildJwk(''), buildJwk('k1')] }),
      );

      await service.onModuleInit();

      await expect(service.getPublicKey('k1')).resolves.toBeDefined();
    });

    it('fails the boot when iam-api answers with a non-2xx status', async () => {
      fetchMock.mockResolvedValue(jwksResponse({}, false, 503));

      await expect(service.onModuleInit()).rejects.toThrow(
        'Failed to fetch JWT public keys from iam-api: HTTP 503',
      );
    });

    it('fails the boot when the request itself fails', async () => {
      fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(service.onModuleInit()).rejects.toThrow('ECONNREFUSED');
    });

    it('fails the boot when the JWKS has an empty key list', async () => {
      fetchMock.mockResolvedValue(jwksResponse({ keys: [] }));

      await expect(service.onModuleInit()).rejects.toThrow(
        'no usable keys with a "kid" in the JWKS response',
      );
    });

    it('fails the boot when the JWKS has no "keys" property', async () => {
      fetchMock.mockResolvedValue(jwksResponse({}));

      await expect(service.onModuleInit()).rejects.toThrow('no usable keys');
    });

    it('fails the boot when the JWKS body is null', async () => {
      fetchMock.mockResolvedValue(jwksResponse(null));

      await expect(service.onModuleInit()).rejects.toThrow('no usable keys');
    });

    it('fails the boot when no key carries a kid', async () => {
      fetchMock.mockResolvedValue(jwksResponse({ keys: [buildJwk()] }));

      await expect(service.onModuleInit()).rejects.toThrow('no usable keys');
    });
  });

  describe('getPublicKey', () => {
    beforeEach(async () => {
      fetchMock.mockResolvedValue(jwksResponse({ keys: [buildJwk('k1')] }));
      await service.onModuleInit();
      fetchMock.mockClear();
    });

    it('returns a cached key without hitting iam-api again', async () => {
      await service.getPublicKey('k1');
      await service.getPublicKey('k1');

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('does not refetch for an unknown kid inside the cooldown window', async () => {
      now += COOLDOWN_MS - 1;

      await expect(service.getPublicKey('rotated')).resolves.toBeUndefined();

      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('refetches for an unknown kid once the cooldown elapsed and returns the new key', async () => {
      now += COOLDOWN_MS;
      fetchMock.mockResolvedValue(
        jwksResponse({ keys: [buildJwk('rotated')] }),
      );

      const key = await service.getPublicKey('rotated');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(key).toMatch(/^-----BEGIN PUBLIC KEY-----/);
    });

    it('returns undefined when the refetch still does not contain the kid', async () => {
      now += COOLDOWN_MS;
      fetchMock.mockResolvedValue(jwksResponse({ keys: [buildJwk('k1')] }));

      await expect(service.getPublicKey('made-up')).resolves.toBeUndefined();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('rate-limits repeated unknown kids after a refetch', async () => {
      now += COOLDOWN_MS;
      fetchMock.mockResolvedValue(jwksResponse({ keys: [buildJwk('k1')] }));

      await service.getPublicKey('made-up-1');
      await service.getPublicKey('made-up-2');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns undefined and logs when the on-demand refetch fails', async () => {
      now += COOLDOWN_MS;
      fetchMock.mockRejectedValue(new Error('network down'));

      await expect(service.getPublicKey('rotated')).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('still serves the known keys when the on-demand refetch fails', async () => {
      now += COOLDOWN_MS;
      fetchMock.mockRejectedValue(new Error('network down'));

      await service.getPublicKey('rotated');

      await expect(service.getPublicKey('k1')).resolves.toBeDefined();
    });
  });

  describe('getPublicKey before the initial load', () => {
    it('fetches the keys on demand because no fetch happened yet', async () => {
      fetchMock.mockResolvedValue(jwksResponse({ keys: [buildJwk('k1')] }));

      await expect(service.getPublicKey('k1')).resolves.toBeDefined();

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('refreshPublicKeys', () => {
    beforeEach(async () => {
      fetchMock.mockResolvedValue(jwksResponse({ keys: [buildJwk('old')] }));
      await service.onModuleInit();
      fetchMock.mockClear();
    });

    it('replaces the known keys with the fetched ones', async () => {
      fetchMock.mockResolvedValue(jwksResponse({ keys: [buildJwk('new')] }));

      await service.refreshPublicKeys();

      await expect(service.getPublicKey('new')).resolves.toBeDefined();
      now += COOLDOWN_MS;
      fetchMock.mockResolvedValue(jwksResponse({ keys: [buildJwk('new')] }));
      await expect(service.getPublicKey('old')).resolves.toBeUndefined();
    });

    it('keeps the previous keys and logs when the fetch times out', async () => {
      fetchMock.mockResolvedValueOnce(jwksResponse({ keys: [buildJwk('k1')] }));
      await service.onModuleInit();
      fetchMock.mockRejectedValue(
        new DOMException('The operation timed out.', 'TimeoutError'),
      );

      await service.refreshPublicKeys();

      await expect(service.getPublicKey('k1')).resolves.toBeDefined();
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.objectContaining({
            message: expect.stringContaining('The operation timed out.'),
          }),
        }),
      );
    });

    it('keeps the previous keys and logs when the fetch fails with an Error', async () => {
      const failure = new Error('boom');
      fetchMock.mockRejectedValue(failure);

      await expect(service.refreshPublicKeys()).resolves.toBeUndefined();

      expect(logger.error).toHaveBeenCalledWith({
        err: { message: 'boom', stack: failure.stack },
        msg: 'Failed to refresh JWT public keys from iam-api; keeping previous keys',
      });
      await expect(service.getPublicKey('old')).resolves.toBeDefined();
    });

    it('keeps the previous keys and logs the HTTP status when iam-api answers 500', async () => {
      fetchMock.mockResolvedValue(jwksResponse({}, false, 500));

      await service.refreshPublicKeys();

      expect(logger.error.mock.calls[0][0]).toMatchObject({
        err: { message: expect.stringContaining('HTTP 500') },
      });
      await expect(service.getPublicKey('old')).resolves.toBeDefined();
    });

    it('keeps the previous keys when the new JWKS has no usable keys', async () => {
      fetchMock.mockResolvedValue(jwksResponse({ keys: [] }));

      await service.refreshPublicKeys();

      expect(logger.error).toHaveBeenCalledTimes(1);
      await expect(service.getPublicKey('old')).resolves.toBeDefined();
    });

    it('logs a non-Error rejection as a string without stack', async () => {
      fetchMock.mockRejectedValue('plain failure');

      await service.refreshPublicKeys();

      expect(logger.error.mock.calls[0][0]).toMatchObject({
        err: { message: 'plain failure', stack: undefined },
      });
    });
  });
});
