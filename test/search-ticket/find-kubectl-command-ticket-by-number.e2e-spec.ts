import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import request from 'supertest';
import { TicketStatus } from '../../src/common/database/ticket-status.enum';
import { Role } from '../../src/common/roles/role.enum';
import { SearchTicketModule } from '../../src/modules/search-ticket/search-ticket.module';
import {
  authorizationHeaderFor,
  authorizationHeaderForClaims,
} from '../helpers/test-auth';
import {
  seedKubectlCommandTicket,
  seedDatabaseManagementTicket,
} from '../helpers/ticket-fixtures';
import { createTicketTestApp, TicketTestApp } from '../helpers/ticket-test-app';

const ENDPOINT = '/tickets/kubernetes/kubectl';
const USER_EMAIL = 'user@example.com';

describe('GET /tickets/kubernetes/kubectl/:number (e2e)', () => {
  let testApp: TicketTestApp;
  const auth = authorizationHeaderFor({
    email: USER_EMAIL,
    roles: [Role.KUBERNATES],
  });

  beforeAll(async () => {
    testApp = await createTicketTestApp({ modules: [SearchTicketModule] });
  });

  beforeEach(async () => {
    await testApp.resetTables();
  });

  afterAll(async () => {
    await testApp.close();
  });

  function call(number: number | string, authorization: string | null = auth) {
    const req = request(testApp.app.getHttpServer()).get(
      ENDPOINT + '/' + number,
    );
    if (authorization) {
      req.set('Authorization', authorization);
    }
    return req;
  }

  describe('lookup', () => {
    it('returns 200 with the ticket that has the requested number', async () => {
      await seedKubectlCommandTicket(testApp.dataSource, { subject: 'First' });
      const second = await seedKubectlCommandTicket(testApp.dataSource, {
        subject: 'Second',
      });
      await seedKubectlCommandTicket(testApp.dataSource, { subject: 'Third' });

      const response = await call(second.number).expect(200);

      expect(response.body.id).toBe(second.id);
      expect(response.body.number).toBe(second.number);
      expect(response.body.subject).toBe('Second');
    });

    it('returns an IN_PROGRESS ticket like any other', async () => {
      const ticket = await seedKubectlCommandTicket(testApp.dataSource, {
        status: TicketStatus.IN_PROGRESS,
      });

      const response = await call(ticket.number).expect(200);

      expect(response.body.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('returns every column of the persisted ticket', async () => {
      const second = await seedKubectlCommandTicket(testApp.dataSource, {
        subject: 'Second',
      });

      const response = await call(second.number).expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: second.id,
          number: second.number,
          informer: 'informer@example.com',
          assignee: 'assignee@example.com',
          department: 'INFRA',
          subject: 'Second',
          description: second.description,
          status: TicketStatus.OPEN,
          response: '',
          kubectlCommand: second.kubectlCommand,
        }),
      );
      expect(typeof response.body.createdAt).toBe('string');
      expect(typeof response.body.updatedAt).toBe('string');
    });

    it('returns the ticket in whatever status it has', async () => {
      const approved = await seedKubectlCommandTicket(testApp.dataSource, {
        status: TicketStatus.APPROVED,
        response: '{"success":true}',
      });

      const response = await call(approved.number).expect(200);

      expect(response.body.status).toBe(TicketStatus.APPROVED);
      expect(response.body.response).toBe('{"success":true}');
    });

    it('returns 404 with the not-found message when the number does not exist', async () => {
      const response = await call(999).expect(404);

      expect(response.body).toEqual({
        statusCode: 404,
        message: 'Kubectl command ticket with number 999 not found',
        error: 'Not Found',
      });
    });

    it('returns 404 for a negative number', async () => {
      const response = await call(-1).expect(404);

      expect(response.body.message).toBe(
        'Kubectl command ticket with number -1 not found',
      );
    });

    it('returns 404 when the number only exists in another ticket type', async () => {
      const foreign = await seedDatabaseManagementTicket(testApp.dataSource);

      await call(foreign.number).expect(404);
    });

    it('does not change the ticket when it is read', async () => {
      const ticket = await seedKubectlCommandTicket(testApp.dataSource);

      const first = await call(ticket.number).expect(200);
      const second = await call(ticket.number).expect(200);

      expect(second.body).toEqual(first.body);
    });
  });

  describe('validation', () => {
    it('returns 400 when the number is not numeric', async () => {
      const response = await call('abc').expect(400);

      expect(response.body).toEqual({
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      });
    });

    it('returns 400 when the number is a decimal', async () => {
      const response = await call('1.5').expect(400);

      expect(response.body.message).toBe(
        'Validation failed (numeric string is expected)',
      );
    });
  });

  describe('authorization', () => {
    it('returns 401 when the request has no bearer token', async () => {
      const ticket = await seedKubectlCommandTicket(testApp.dataSource);
      const response = await call(ticket.number, null).expect(401);

      expect(response.body.message).toBe('Missing or malformed bearer token');
    });

    it('returns 401 when the token is signed with an unknown key', async () => {
      const ticket = await seedKubectlCommandTicket(testApp.dataSource);
      const response = await call(
        ticket.number,
        'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Im90aGVyIn0.e30.invalid',
      ).expect(401);

      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('returns 403 when the user only has the COMMON_USER role', async () => {
      const ticket = await seedKubectlCommandTicket(testApp.dataSource);
      const response = await call(
        ticket.number,
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.COMMON_USER],
        }),
      ).expect(403);

      expect(response.body.message).toBe('You do not have the required role');
    });

    it('returns 403 when the user only has roles of another domain', async () => {
      const ticket = await seedKubectlCommandTicket(testApp.dataSource);
      await call(
        ticket.number,
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.DATABASE, Role.SERVER_APPROVER],
        }),
      ).expect(403);
    });

    it('returns 403 when the token was issued for another application', async () => {
      const ticket = await seedKubectlCommandTicket(testApp.dataSource);
      const response = await call(
        ticket.number,
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
      const ticket = await seedKubectlCommandTicket(testApp.dataSource);
      const response = await call(
        ticket.number,
        authorizationHeaderForClaims({ email: 'user@example.com' }),
      ).expect(403);

      expect(response.body.message).toBe(
        'The token does not carry application information',
      );
    });

    it('accepts the ADMIN role', async () => {
      const ticket = await seedKubectlCommandTicket(testApp.dataSource);
      await call(
        ticket.number,
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.ADMIN] }),
      ).expect(200);
    });

    it('accepts the KUBERNATES role', async () => {
      const ticket = await seedKubectlCommandTicket(testApp.dataSource);
      await call(
        ticket.number,
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.KUBERNATES] }),
      ).expect(200);
    });

    it('accepts the KUBERNATES_APPROVER role', async () => {
      const ticket = await seedKubectlCommandTicket(testApp.dataSource);
      await call(
        ticket.number,
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.KUBERNATES_APPROVER],
        }),
      ).expect(200);
    });
  });
});
