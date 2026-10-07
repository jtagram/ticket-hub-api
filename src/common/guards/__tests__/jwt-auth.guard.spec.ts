import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Logger } from 'nestjs-pino';
import { JwtPublicKeyService } from '../../jwt/jwt-public-key.service';
import { JwtAuthGuard } from '../jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../public.decorator';

// @nestjs/config is ESM-only and Jest runs as CommonJS. The service is built
// by hand below, so only the class token needs to exist.
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));
// @nestjs/schedule is ESM-only too; the @Interval scheduling is not under test.
jest.mock('@nestjs/schedule', () => ({ Interval: () => () => undefined }));

const MISSING = 'Missing or malformed bearer token';
const INVALID = 'Invalid or expired token';

describe('JwtAuthGuard', () => {
  let jwtService: {
    decode: jest.Mock;
    verifyAsync: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  };
  let reflector: { getAllAndOverride: jest.Mock };
  let publicKeyService: {
    getPublicKey: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  };
  let logger: { warn: jest.Mock; error: jest.Mock };
  let guard: JwtAuthGuard;
  let request: Record<string, unknown>;
  let context: ExecutionContext;
  const handler = function handler() {};
  class Controller {}

  const buildContext = (headers: Record<string, string>): ExecutionContext => {
    request = { headers };
    return {
      getHandler: () => handler,
      getClass: () => Controller,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jwtService = {
      decode: jest.fn(),
      verifyAsync: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    publicKeyService = {
      getPublicKey: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    logger = { warn: jest.fn(), error: jest.fn() };
    guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
      publicKeyService as unknown as JwtPublicKeyService,
      logger as unknown as Logger,
    );
    context = buildContext({ authorization: 'Bearer the.jwt.token' });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('public routes', () => {
    it('allows a public route without looking at the request', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      context = buildContext({});

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(jwtService.decode).not.toHaveBeenCalled();
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      expect(request.user).toBeUndefined();
    });

    it('reads the @Public metadata from the handler and the class', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      await guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        handler,
        Controller,
      ]);
    });
  });

  describe('bearer token extraction', () => {
    it('rejects a request without Authorization header', async () => {
      context = buildContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException(MISSING),
      );
    });

    it('rejects an Authorization header that is not Bearer', async () => {
      context = buildContext({ authorization: 'Basic abc123' });

      await expect(guard.canActivate(context)).rejects.toThrow(MISSING);
    });

    it('rejects "Bearer" without a token', async () => {
      context = buildContext({ authorization: 'Bearer' });

      await expect(guard.canActivate(context)).rejects.toThrow(MISSING);
    });

    it('rejects a lowercase "bearer" scheme', async () => {
      context = buildContext({ authorization: 'bearer the.jwt.token' });

      await expect(guard.canActivate(context)).rejects.toThrow(MISSING);
    });

    it('does not decode anything when the token is missing', async () => {
      context = buildContext({});

      await guard.canActivate(context).catch(() => undefined);

      expect(jwtService.decode).not.toHaveBeenCalled();
    });
  });

  describe('public key lookup', () => {
    it('rejects a token that cannot be decoded', async () => {
      jwtService.decode.mockReturnValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException(INVALID),
      );
      expect(publicKeyService.getPublicKey).not.toHaveBeenCalled();
    });

    it('rejects a token whose header has no kid', async () => {
      jwtService.decode.mockReturnValue({ header: { alg: 'RS256' } });

      await expect(guard.canActivate(context)).rejects.toThrow(INVALID);
      expect(publicKeyService.getPublicKey).not.toHaveBeenCalled();
    });

    it('rejects a token whose kid is unknown to the public key service', async () => {
      jwtService.decode.mockReturnValue({ header: { kid: 'unknown' } });
      publicKeyService.getPublicKey.mockResolvedValue(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(INVALID);
      expect(publicKeyService.getPublicKey).toHaveBeenCalledWith('unknown');
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('decodes the token asking for the complete (header) form', async () => {
      jwtService.decode.mockReturnValue({ header: { kid: 'k1' } });
      publicKeyService.getPublicKey.mockResolvedValue('PEM');
      jwtService.verifyAsync.mockResolvedValue({});

      await guard.canActivate(context);

      expect(jwtService.decode).toHaveBeenCalledWith('the.jwt.token', {
        complete: true,
      });
    });
  });

  describe('signature verification', () => {
    beforeEach(() => {
      jwtService.decode.mockReturnValue({ header: { kid: 'k1' } });
      publicKeyService.getPublicKey.mockResolvedValue('PEM-KEY');
    });

    it('verifies with the key of the kid, restricted to RS256', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 1 });

      await guard.canActivate(context);

      expect(publicKeyService.getPublicKey).toHaveBeenCalledWith('k1');
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('the.jwt.token', {
        publicKey: 'PEM-KEY',
        algorithms: ['RS256'],
      });
    });

    it('attaches the verified payload as request.user and allows the request', async () => {
      const payload = { sub: 1, apps: { application: { name: 'ticket-hub' } } };
      jwtService.verifyAsync.mockResolvedValue(payload);

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(request.user).toBe(payload);
    });

    it('rejects with the invalid-token message when verification fails', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException(INVALID),
      );
      expect(request.user).toBeUndefined();
    });

    it('logs the verification failure with the pino logger', async () => {
      const failure = new Error('signature mismatch');
      jwtService.verifyAsync.mockRejectedValue(failure);

      await guard.canActivate(context).catch(() => undefined);

      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn).toHaveBeenCalledWith({
        err: { message: 'signature mismatch', stack: failure.stack },
        msg: 'Failed to verify JWT',
      });
    });

    it('does not write to the console when verification fails', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await guard.canActivate(context).catch(() => undefined);

      expect(console.error).not.toHaveBeenCalled();
    });

    it('logs a non-Error rejection as a string without stack', async () => {
      jwtService.verifyAsync.mockRejectedValue('boom');

      await guard.canActivate(context).catch(() => undefined);

      expect(logger.warn).toHaveBeenCalledWith({
        err: { message: 'boom', stack: undefined },
        msg: 'Failed to verify JWT',
      });
    });

    it('does not log when verification succeeds', async () => {
      jwtService.verifyAsync.mockResolvedValue({ email: 'user@example.com' });
      publicKeyService.getPublicKey.mockResolvedValue('PEM');
      jwtService.decode.mockReturnValue({ header: { kid: 'k1' } });

      await guard.canActivate(context);

      expect(logger.warn).not.toHaveBeenCalled();
    });
  });
});
