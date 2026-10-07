import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import { HttpException } from '@nestjs/common';
import request from 'supertest';
import { Role } from '../../src/common/roles/role.enum';
import { IamApiConnector } from '../../src/modules/iam-api/iam-api.connector';
import { InfraHubApiConnector } from '../../src/modules/infra-hub-api/infra-hub-api.connector';
import { SearchForValueListsModule } from '../../src/modules/search-for-value-lists/search-for-value-lists.module';
import {
  createIamConnectorFake,
  createInfraHubConnectorFake,
  resetFake,
} from '../helpers/outbound-fakes';
import {
  authorizationHeaderFor,
  authorizationHeaderForClaims,
  TEST_APPLICATION_NAME,
} from '../helpers/test-auth';
import { createTicketTestApp, TicketTestApp } from '../helpers/ticket-test-app';

const ENDPOINT = '/search-for-value-lists/assignees';
const USER_EMAIL = 'user@example.com';

describe('GET /search-for-value-lists/assignees (e2e)', () => {
  let testApp: TicketTestApp;
  const iam = createIamConnectorFake();
  const infraHub = createInfraHubConnectorFake();
  const auth = authorizationHeaderFor({
    email: USER_EMAIL,
    roles: [Role.DATABASE],
  });

  beforeAll(async () => {
    testApp = await createTicketTestApp({
      modules: [SearchForValueListsModule],
      overrides: [
        { provide: IamApiConnector, useValue: iam },
        { provide: InfraHubApiConnector, useValue: infraHub },
      ],
    });
  });

  beforeEach(() => {
    resetFake(iam);
    resetFake(infraHub);
  });

  afterAll(async () => {
    await testApp.close();
  });

  function call(authorization: string | null = auth) {
    const req = request(testApp.app.getHttpServer()).get(ENDPOINT);
    if (authorization) {
      req.set('Authorization', authorization);
    }
    return req;
  }

  describe('listing', () => {
    it('returns 200 with one value-label pair per internal user', async () => {
      iam.findInternalUsersByRole.mockResolvedValue([
        { id: 1, name: 'Ada', lastname: 'Lovelace', email: 'ada@example.com' },
        { id: 2, name: 'Alan', lastname: 'Turing', email: 'alan@example.com' },
      ]);

      const response = await call().expect(200);

      expect(response.body).toEqual([
        { value: 'ada@example.com', label: 'Ada Lovelace (ada@example.com)' },
        {
          value: 'alan@example.com',
          label: 'Alan Turing (alan@example.com)',
        },
      ]);
    });

    it('returns 200 with an empty array when iam-api finds no users', async () => {
      iam.findInternalUsersByRole.mockResolvedValue([]);

      const response = await call().expect(200);

      expect(response.body).toEqual([]);
    });

    it('asks iam-api for the configured application and every approver role', async () => {
      iam.findInternalUsersByRole.mockResolvedValue([]);

      await call().expect(200);

      expect(iam.findInternalUsersByRole).toHaveBeenCalledTimes(1);
      expect(iam.findInternalUsersByRole).toHaveBeenCalledWith(
        TEST_APPLICATION_NAME,
        [
          Role.ADMIN,
          Role.DATABASE_APPROVER,
          Role.SERVER_APPROVER,
          Role.KUBERNATES_APPROVER,
        ],
      );
    });

    it('does not call infra-hub-api', async () => {
      iam.findInternalUsersByRole.mockResolvedValue([]);

      await call().expect(200);

      expect(infraHub.listDeployments).not.toHaveBeenCalled();
      expect(infraHub.listDatabases).not.toHaveBeenCalled();
    });
  });

  describe('iam-api failures', () => {
    it('forwards the status and body of an iam-api HTTP error', async () => {
      iam.findInternalUsersByRole.mockRejectedValue(
        new HttpException(
          { statusCode: 503, message: 'iam-api is unavailable' },
          503,
        ),
      );

      const response = await call().expect(503);

      expect(response.body).toEqual({
        statusCode: 503,
        message: 'iam-api is unavailable',
      });
    });

    it('answers 500 with the generic message when the call fails without an HTTP response', async () => {
      iam.findInternalUsersByRole.mockRejectedValue(
        new Error('connect ECONNREFUSED'),
      );

      const response = await call().expect(500);

      expect(response.body).toEqual({
        statusCode: 500,
        message: 'An unexpected error occurred. Please try again later.',
      });
    });
  });

  describe('authorization', () => {
    it('returns 401 when the request has no bearer token', async () => {
      const response = await call(null).expect(401);

      expect(response.body.message).toBe('Missing or malformed bearer token');
      expect(iam.findInternalUsersByRole).not.toHaveBeenCalled();
    });

    it('returns 401 when the token is signed with an unknown key', async () => {
      const response = await call(
        'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Im90aGVyIn0.e30.invalid',
      ).expect(401);

      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('returns 403 when the user only has the COMMON_USER role', async () => {
      const response = await call(
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.COMMON_USER],
        }),
      ).expect(403);

      expect(response.body.message).toBe('You do not have the required role');
      expect(iam.findInternalUsersByRole).not.toHaveBeenCalled();
    });

    it('returns 403 when the token was issued for another application', async () => {
      const response = await call(
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.ADMIN],
          applicationName: 'iam',
        }),
      ).expect(403);

      expect(response.body.message).toBe(
        'This token was not issued for the ticket-hub-api application',
      );
      expect(iam.findInternalUsersByRole).not.toHaveBeenCalled();
    });

    it('returns 403 when the verified token carries no apps claim', async () => {
      const response = await call(
        authorizationHeaderForClaims({ email: 'user@example.com' }),
      ).expect(403);

      expect(response.body.message).toBe(
        'The token does not carry application information',
      );
      expect(iam.findInternalUsersByRole).not.toHaveBeenCalled();
    });

    it('accepts the ADMIN role', async () => {
      iam.findInternalUsersByRole.mockResolvedValue([]);

      await call(
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.ADMIN] }),
      ).expect(200);
    });

    it('accepts the DATABASE role', async () => {
      iam.findInternalUsersByRole.mockResolvedValue([]);

      await call(
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.DATABASE] }),
      ).expect(200);
    });

    it('accepts the DATABASE_APPROVER role', async () => {
      iam.findInternalUsersByRole.mockResolvedValue([]);

      await call(
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.DATABASE_APPROVER],
        }),
      ).expect(200);
    });

    it('accepts the SERVER role', async () => {
      iam.findInternalUsersByRole.mockResolvedValue([]);

      await call(
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.SERVER] }),
      ).expect(200);
    });

    it('accepts the SERVER_APPROVER role', async () => {
      iam.findInternalUsersByRole.mockResolvedValue([]);

      await call(
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.SERVER_APPROVER],
        }),
      ).expect(200);
    });

    it('accepts the KUBERNATES role', async () => {
      iam.findInternalUsersByRole.mockResolvedValue([]);

      await call(
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.KUBERNATES] }),
      ).expect(200);
    });

    it('accepts the KUBERNATES_APPROVER role', async () => {
      iam.findInternalUsersByRole.mockResolvedValue([]);

      await call(
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.KUBERNATES_APPROVER],
        }),
      ).expect(200);
    });
  });
});
