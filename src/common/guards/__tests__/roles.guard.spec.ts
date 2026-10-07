import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Role } from '../../roles/role.enum';
import { ROLES_KEY } from '../roles.decorator';
import { RolesGuard } from '../roles.guard';

// @nestjs/config is ESM-only and Jest runs as CommonJS. The service is built
// by hand below, so only the class token needs to exist.
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

const APPLICATION_NAME = 'ticket-hub';

const buildUser = (applicationName: string, roles: string[]) => ({
  apps: {
    application: {
      id: 1,
      name: applicationName,
      description: '',
      roles: roles.map((name, index) => ({ id: index, name, description: '' })),
    },
  },
});

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let configService: { get: jest.Mock };
  let guard: RolesGuard;
  const handler = function handler() {};
  class Controller {}

  const buildContext = (user?: unknown): ExecutionContext =>
    ({
      getHandler: () => handler,
      getClass: () => Controller,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    configService = { get: jest.fn().mockReturnValue(APPLICATION_NAME) };
    guard = new RolesGuard(
      reflector as unknown as Reflector,
      configService as unknown as ConfigService,
    );
  });

  describe('routes without required roles', () => {
    it('allows when no @Roles metadata exists, even without a user', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      expect(guard.canActivate(buildContext())).toBe(true);
    });

    it('allows when @Roles was declared empty', () => {
      reflector.getAllAndOverride.mockReturnValue([]);

      expect(guard.canActivate(buildContext())).toBe(true);
    });

    it('reads the roles metadata from the handler and the class', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      guard.canActivate(buildContext());

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        handler,
        Controller,
      ]);
    });
  });

  describe('routes with required roles', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.SERVER]);
    });

    it('throws Forbidden when there is no authenticated user', () => {
      expect(() => guard.canActivate(buildContext())).toThrow(
        new ForbiddenException(
          'RolesGuard ran without an authenticated user - JwtAuthGuard must run first',
        ),
      );
    });

    it('throws Forbidden when the token was issued for another application', () => {
      const user = buildUser('iam', ['ADMIN']);

      expect(() => guard.canActivate(buildContext(user))).toThrow(
        new ForbiddenException(
          'This token was not issued for the ticket-hub-api application',
        ),
      );
    });

    it('throws Forbidden instead of a TypeError when the token has no apps claim', () => {
      const user = { email: 'user@example.com' };

      expect(() => guard.canActivate(buildContext(user))).toThrow(
        new ForbiddenException(
          'The token does not carry application information',
        ),
      );
    });

    it('throws Forbidden when apps has no application', () => {
      const user = { email: 'user@example.com', apps: {} };

      expect(() => guard.canActivate(buildContext(user))).toThrow(
        new ForbiddenException(
          'The token does not carry application information',
        ),
      );
    });

    it('throws Forbidden when apps is null', () => {
      const user = { email: 'user@example.com', apps: null };

      expect(() => guard.canActivate(buildContext(user))).toThrow(
        ForbiddenException,
      );
    });

    it('throws Forbidden when the application carries no roles array', () => {
      const user = {
        apps: { application: { id: 1, name: APPLICATION_NAME } },
      };

      expect(() => guard.canActivate(buildContext(user))).toThrow(
        new ForbiddenException('You do not have the required role'),
      );
    });

    it('throws Forbidden when the roles claim is not an array', () => {
      const user = {
        apps: {
          application: { id: 1, name: APPLICATION_NAME, roles: 'ADMIN' },
        },
      };

      expect(() => guard.canActivate(buildContext(user))).toThrow(
        new ForbiddenException('You do not have the required role'),
      );
    });

    it('throws Forbidden when a role entry is null', () => {
      const user = {
        apps: { application: { id: 1, name: APPLICATION_NAME, roles: [null] } },
      };

      expect(() => guard.canActivate(buildContext(user))).toThrow(
        new ForbiddenException('You do not have the required role'),
      );
    });

    it('compares the application name with TICKET_HUB_API_APPLICATION_NAME', () => {
      configService.get.mockReturnValue('other-name');
      const user = buildUser(APPLICATION_NAME, ['ADMIN']);

      expect(() => guard.canActivate(buildContext(user))).toThrow(
        'not issued for the ticket-hub-api application',
      );
      expect(configService.get).toHaveBeenCalledWith(
        'TICKET_HUB_API_APPLICATION_NAME',
      );
    });

    it('throws Forbidden when the user has none of the required roles', () => {
      const user = buildUser(APPLICATION_NAME, ['COMMON_USER', 'DATABASE']);

      expect(() => guard.canActivate(buildContext(user))).toThrow(
        new ForbiddenException('You do not have the required role'),
      );
    });

    it('throws Forbidden when the user has no roles at all', () => {
      const user = buildUser(APPLICATION_NAME, []);

      expect(() => guard.canActivate(buildContext(user))).toThrow(
        'You do not have the required role',
      );
    });

    it('allows a user that has one of the required roles', () => {
      const user = buildUser(APPLICATION_NAME, ['COMMON_USER', 'SERVER']);

      expect(guard.canActivate(buildContext(user))).toBe(true);
    });

    it('allows a user that has all the required roles', () => {
      const user = buildUser(APPLICATION_NAME, ['ADMIN', 'SERVER']);

      expect(guard.canActivate(buildContext(user))).toBe(true);
    });

    it('matches role names case-sensitively', () => {
      const user = buildUser(APPLICATION_NAME, ['admin']);

      expect(() => guard.canActivate(buildContext(user))).toThrow(
        'You do not have the required role',
      );
    });
  });
});
