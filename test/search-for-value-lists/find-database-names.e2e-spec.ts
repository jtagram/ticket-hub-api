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
} from '../helpers/test-auth';
import { createTicketTestApp, TicketTestApp } from '../helpers/ticket-test-app';

const ENDPOINT = '/search-for-value-lists/database-names';
const USER_EMAIL = 'user@example.com';

describe('GET /search-for-value-lists/database-names (e2e)', () => {
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

  function call(
    query: Record<string, string> = {
      namespace: 'prod',
      deployment: 'postgres-main',
    },
    authorization: string | null = auth,
  ) {
    const req = request(testApp.app.getHttpServer()).get(ENDPOINT).query(query);
    if (authorization) {
      req.set('Authorization', authorization);
    }
    return req;
  }

  describe('listing', () => {
    it('returns 200 with one value-label pair per database', async () => {
      infraHub.listDatabases.mockResolvedValue({
        databases: ['orders', 'billing'],
      });

      const response = await call().expect(200);

      expect(response.body).toEqual([
        { value: 'orders', label: 'orders' },
        { value: 'billing', label: 'billing' },
      ]);
    });

    it('returns 200 with an empty array when the deployment has no databases', async () => {
      infraHub.listDatabases.mockResolvedValue({ databases: [] });

      const response = await call().expect(200);

      expect(response.body).toEqual([]);
    });

    it('asks infra-hub-api for the namespace and deployment received in the query string', async () => {
      infraHub.listDatabases.mockResolvedValue({ databases: [] });

      await call({
        namespace: 'staging',
        deployment: 'postgres-replica',
      }).expect(200);

      expect(infraHub.listDatabases).toHaveBeenCalledTimes(1);
      expect(infraHub.listDatabases).toHaveBeenCalledWith(
        'staging',
        'postgres-replica',
      );
    });

    it('accepts a namespace and a deployment of exactly 63 characters', async () => {
      infraHub.listDatabases.mockResolvedValue({ databases: [] });

      await call({
        namespace: 'a'.repeat(63),
        deployment: 'b'.repeat(63),
      }).expect(200);

      expect(infraHub.listDatabases).toHaveBeenCalledWith(
        'a'.repeat(63),
        'b'.repeat(63),
      );
    });

    it('does not call iam-api nor list deployments', async () => {
      infraHub.listDatabases.mockResolvedValue({ databases: [] });

      await call().expect(200);

      expect(iam.findInternalUsersByRole).not.toHaveBeenCalled();
      expect(infraHub.listDeployments).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('returns 400 when the namespace is missing', async () => {
      const response = await call({ deployment: 'postgres-main' }).expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toEqual(
        expect.arrayContaining([
          'namespace must be a string',
          'namespace should not be empty',
        ]),
      );
    });

    it('returns 400 when the deployment is missing', async () => {
      const response = await call({ namespace: 'prod' }).expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          'deployment must be a string',
          'deployment should not be empty',
        ]),
      );
    });

    it('returns 400 listing both properties when the query string is empty', async () => {
      const response = await call({}).expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          'namespace should not be empty',
          'deployment should not be empty',
        ]),
      );
    });

    it('returns 400 when the namespace is empty', async () => {
      const response = await call({
        namespace: '',
        deployment: 'postgres-main',
      }).expect(400);

      expect(response.body.message).toEqual(['namespace should not be empty']);
    });

    it('returns 400 when the deployment is empty', async () => {
      const response = await call({
        namespace: 'prod',
        deployment: '',
      }).expect(400);

      expect(response.body.message).toEqual(['deployment should not be empty']);
    });

    it('returns 400 when the namespace exceeds 63 characters', async () => {
      const response = await call({
        namespace: 'a'.repeat(64),
        deployment: 'postgres-main',
      }).expect(400);

      expect(response.body.message).toEqual([
        'namespace must be shorter than or equal to 63 characters',
      ]);
    });

    it('returns 400 when the deployment exceeds 63 characters', async () => {
      const response = await call({
        namespace: 'prod',
        deployment: 'b'.repeat(64),
      }).expect(400);

      expect(response.body.message).toEqual([
        'deployment must be shorter than or equal to 63 characters',
      ]);
    });

    it('returns 400 when the query string has an unknown property', async () => {
      const response = await call({
        namespace: 'prod',
        deployment: 'postgres-main',
        unexpected: 'value',
      }).expect(400);

      expect(response.body.message).toEqual([
        'property unexpected should not exist',
      ]);
    });

    it('does not call infra-hub-api when validation fails', async () => {
      await call({ namespace: 'prod' }).expect(400);

      expect(infraHub.listDatabases).not.toHaveBeenCalled();
    });
  });

  describe('infra-hub-api failures', () => {
    it('forwards the status and body of an infra-hub-api HTTP error', async () => {
      infraHub.listDatabases.mockRejectedValue(
        new HttpException(
          { statusCode: 404, message: 'Deployment postgres-main not found' },
          404,
        ),
      );

      const response = await call().expect(404);

      expect(response.body).toEqual({
        statusCode: 404,
        message: 'Deployment postgres-main not found',
      });
    });

    it('answers 500 with the generic message when the call fails without an HTTP response', async () => {
      infraHub.listDatabases.mockRejectedValue(
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
    const query = { namespace: 'prod', deployment: 'postgres-main' };

    it('returns 401 when the request has no bearer token', async () => {
      const response = await call(query, null).expect(401);

      expect(response.body.message).toBe('Missing or malformed bearer token');
      expect(infraHub.listDatabases).not.toHaveBeenCalled();
    });

    it('returns 401 when the token is signed with an unknown key', async () => {
      const response = await call(
        query,
        'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Im90aGVyIn0.e30.invalid',
      ).expect(401);

      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('returns 403 when the user only has the COMMON_USER role', async () => {
      const response = await call(
        query,
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.COMMON_USER],
        }),
      ).expect(403);

      expect(response.body.message).toBe('You do not have the required role');
      expect(infraHub.listDatabases).not.toHaveBeenCalled();
    });

    it('returns 403 when the token was issued for another application', async () => {
      const response = await call(
        query,
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.ADMIN],
          applicationName: 'iam',
        }),
      ).expect(403);

      expect(response.body.message).toBe(
        'This token was not issued for the ticket-hub-api application',
      );
      expect(infraHub.listDatabases).not.toHaveBeenCalled();
    });

    it('returns 403 when the verified token carries no apps claim', async () => {
      const response = await call(
        query,
        authorizationHeaderForClaims({ email: 'user@example.com' }),
      ).expect(403);

      expect(response.body.message).toBe(
        'The token does not carry application information',
      );
      expect(infraHub.listDatabases).not.toHaveBeenCalled();
    });

    it('accepts the ADMIN role', async () => {
      infraHub.listDatabases.mockResolvedValue({ databases: [] });

      await call(
        query,
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.ADMIN] }),
      ).expect(200);
    });

    it('accepts the DATABASE role', async () => {
      infraHub.listDatabases.mockResolvedValue({ databases: [] });

      await call(
        query,
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.DATABASE] }),
      ).expect(200);
    });

    it('accepts the DATABASE_APPROVER role', async () => {
      infraHub.listDatabases.mockResolvedValue({ databases: [] });

      await call(
        query,
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.DATABASE_APPROVER],
        }),
      ).expect(200);
    });

    it('returns 403 when the user only has the SERVER role', async () => {
      const response = await call(
        query,
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.SERVER] }),
      ).expect(403);

      expect(response.body.message).toBe('You do not have the required role');
      expect(infraHub.listDatabases).not.toHaveBeenCalled();
    });

    it('returns 403 when the user only has the KUBERNATES_APPROVER role', async () => {
      const response = await call(
        query,
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.KUBERNATES_APPROVER],
        }),
      ).expect(403);

      expect(response.body.message).toBe('You do not have the required role');
      expect(infraHub.listDatabases).not.toHaveBeenCalled();
    });
  });
});
