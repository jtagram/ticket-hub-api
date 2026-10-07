import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import request from 'supertest';
import { ServerManagementTicketEntity } from '../../src/common/database/server-management-ticket/server-management-ticket.entity';
import { TicketStatus } from '../../src/common/database/ticket-status.enum';
import { Role } from '../../src/common/roles/role.enum';
import {
  CreateTicketTestApp,
  createCreateTicketTestApp,
} from '../helpers/create-ticket-test-app';
import {
  authorizationHeaderFor,
  authorizationHeaderForClaims,
} from '../helpers/test-auth';

const ENDPOINT = '/tickets/server/management';
const USER_EMAIL = 'server.user@example.com';

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    informer: 'client.sent@example.com',
    assignee: 'assignee@example.com',
    department: 'PLATFORM',
    subject: 'Restart web servers',
    description: 'Run the restart playbook on the web servers',
    codeAnsible: '- hosts: all\n  tasks:\n    - ping:',
    ...overrides,
  };
}

describe('POST /tickets/server/management (e2e)', () => {
  let testApp: CreateTicketTestApp;
  const auth = authorizationHeaderFor({
    email: USER_EMAIL,
    roles: [Role.SERVER],
  });

  beforeAll(async () => {
    testApp = await createCreateTicketTestApp();
  });

  beforeEach(async () => {
    await testApp.resetTables();
  });

  afterAll(async () => {
    await testApp.close();
  });

  function post(body: unknown, authorization: string | null = auth) {
    const req = request(testApp.app.getHttpServer()).post(ENDPOINT);
    if (authorization) {
      req.set('Authorization', authorization);
    }
    return req.send(body as object);
  }

  describe('creation', () => {
    it('returns 201 with the persisted ticket and stores it in the database', async () => {
      const response = await post(validPayload()).expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          number: expect.any(Number),
          informer: USER_EMAIL,
          assignee: 'assignee@example.com',
          department: 'PLATFORM',
          subject: 'Restart web servers',
          description: 'Run the restart playbook on the web servers',
          status: TicketStatus.OPEN,
          response: '',
          codeAnsible: '- hosts: all\n  tasks:\n    - ping:',
        }),
      );

      const rows = await testApp.dataSource
        .getRepository(ServerManagementTicketEntity)
        .find();
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(response.body.id);
      expect(rows[0].number).toBe(response.body.number);
      expect(rows[0].informer).toBe(USER_EMAIL);
      expect(rows[0].status).toBe(TicketStatus.OPEN);
      expect(rows[0].response).toBe('');
      expect(rows[0].codeAnsible).toBe('- hosts: all\n  tasks:\n    - ping:');
    });

    it('assigns increasing numbers to successive tickets', async () => {
      const first = await post(validPayload()).expect(201);
      const second = await post(validPayload({ subject: 'Second' })).expect(
        201,
      );
      const third = await post(validPayload({ subject: 'Third' })).expect(201);

      expect(second.body.number).toBeGreaterThan(first.body.number);
      expect(third.body.number).toBeGreaterThan(second.body.number);
    });

    it('ignores an informer sent in the body and stores the authenticated user email', async () => {
      const response = await post(
        validPayload({ informer: 'someone.else@example.com' }),
      ).expect(201);

      expect(response.body.informer).toBe(USER_EMAIL);
      const rows = await testApp.dataSource
        .getRepository(ServerManagementTicketEntity)
        .find();
      expect(rows[0].informer).toBe(USER_EMAIL);
    });

    it('returns 400 when the informer sent in the body is not a valid email', async () => {
      const response = await post(
        validPayload({ informer: 'not-an-email' }),
      ).expect(400);

      expect(response.body.message).toEqual(['informer must be an email']);
    });
  });

  describe('validation', () => {
    it('returns 400 when a required field is missing', async () => {
      const { subject, ...payload } = validPayload();
      expect(subject).toBeDefined();

      const response = await post(payload).expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toEqual(
        expect.arrayContaining(['subject must be a string']),
      );
    });

    it('returns 400 when a field exceeds its maximum length', async () => {
      const response = await post(
        validPayload({ subject: 'a'.repeat(501) }),
      ).expect(400);

      expect(response.body.message).toEqual([
        'subject must be shorter than or equal to 500 characters',
      ]);
    });

    it('returns 400 when the body has an unknown property', async () => {
      const response = await post(validPayload({ unexpected: 'value' })).expect(
        400,
      );

      expect(response.body.message).toEqual([
        'property unexpected should not exist',
      ]);
    });

    it('does not require the informer in the body (the token email is used)', async () => {
      const { informer, ...payload } = validPayload();
      expect(informer).toBeDefined();

      const response = await post(payload).expect(201);

      expect(response.body.informer).toBe(USER_EMAIL);
      const rows = await testApp.dataSource
        .getRepository(ServerManagementTicketEntity)
        .find();
      expect(rows).toHaveLength(1);
      expect(rows[0].informer).toBe(USER_EMAIL);
    });

    it('returns 400 when the informer is present but empty', async () => {
      const response = await post(validPayload({ informer: '' })).expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['informer must be an email']),
      );
    });

    it('returns 400 when a field has the wrong type', async () => {
      const response = await post(validPayload({ codeAnsible: 123 })).expect(
        400,
      );

      expect(response.body.message).toEqual(
        expect.arrayContaining(['codeAnsible must be a string']),
      );
    });

    it('does not persist anything when validation fails', async () => {
      await post(validPayload({ unexpected: 'value' })).expect(400);

      const count = await testApp.dataSource
        .getRepository(ServerManagementTicketEntity)
        .count();
      expect(count).toBe(0);
    });

    it('returns 400 when a required field is whitespace only', async () => {
      const response = await post(validPayload({ subject: '   ' })).expect(400);

      expect(response.body.message).toEqual(['subject must not be blank']);
      const count = await testApp.dataSource
        .getRepository(ServerManagementTicketEntity)
        .count();
      expect(count).toBe(0);
    });

    it('returns 400 when codeAnsible is whitespace only', async () => {
      const response = await post(validPayload({ codeAnsible: '   ' })).expect(
        400,
      );

      expect(response.body.message).toEqual(['codeAnsible must not be blank']);
      const count = await testApp.dataSource
        .getRepository(ServerManagementTicketEntity)
        .count();
      expect(count).toBe(0);
    });

    it('returns 400 when description is made only of tabs and line breaks', async () => {
      const response = await post(
        validPayload({ description: ' \t\r\n ' }),
      ).expect(400);

      expect(response.body.message).toEqual(['description must not be blank']);
      const count = await testApp.dataSource
        .getRepository(ServerManagementTicketEntity)
        .count();
      expect(count).toBe(0);
    });
  });

  describe('authorization', () => {
    it('returns 401 when the request has no bearer token', async () => {
      const response = await post(validPayload(), null).expect(401);

      expect(response.body.message).toBe('Missing or malformed bearer token');
    });

    it('returns 401 when the token is signed with an unknown key', async () => {
      const response = await post(
        validPayload(),
        'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Im90aGVyIn0.e30.invalid',
      ).expect(401);

      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('returns 403 when the user only has the COMMON_USER role', async () => {
      const response = await post(
        validPayload(),
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.COMMON_USER],
        }),
      ).expect(403);

      expect(response.body.message).toBe('You do not have the required role');
    });

    it('returns 403 when the user only has roles of another domain', async () => {
      await post(
        validPayload(),
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.DATABASE, Role.KUBERNATES],
        }),
      ).expect(403);
    });

    it('returns 403 when the token was issued for another application', async () => {
      const response = await post(
        validPayload(),
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.ADMIN],
          applicationName: 'iam',
        }),
      ).expect(403);

      expect(response.body.message).toBe(
        'This token was not issued for the ticket-hub-api application',
      );
    });

    it('returns 403 when the verified token carries no apps claim', async () => {
      const response = await post(
        validPayload(),
        authorizationHeaderForClaims({ email: 'user@example.com' }),
      ).expect(403);

      expect(response.body.message).toBe(
        'The token does not carry application information',
      );
    });

    it('does not persist anything when the user is forbidden', async () => {
      await post(
        validPayload(),
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.COMMON_USER],
        }),
      ).expect(403);

      const count = await testApp.dataSource
        .getRepository(ServerManagementTicketEntity)
        .count();
      expect(count).toBe(0);
    });

    it('accepts the ADMIN role', async () => {
      await post(
        validPayload(),
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.ADMIN] }),
      ).expect(201);
    });

    it('accepts the SERVER_APPROVER role', async () => {
      await post(
        validPayload(),
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.SERVER_APPROVER],
        }),
      ).expect(201);
    });
  });
});
