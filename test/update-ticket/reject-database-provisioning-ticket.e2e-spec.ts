import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import request from 'supertest';
import { DatabaseProvisioningTicketEntity } from '../../src/common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { TicketStatus } from '../../src/common/database/ticket-status.enum';
import { Role } from '../../src/common/roles/role.enum';
import { InfraHubApiConnector } from '../../src/modules/infra-hub-api/infra-hub-api.connector';
import { UpdateTicketModule } from '../../src/modules/update-ticket/update-ticket.module';
import {
  callCounts,
  createInfraHubConnectorFake,
  resetFake,
} from '../helpers/outbound-fakes';
import {
  authorizationHeaderFor,
  authorizationHeaderForClaims,
} from '../helpers/test-auth';
import {
  seedDatabaseProvisioningTicket,
  seedServerManagementTicket,
} from '../helpers/ticket-fixtures';
import { createTicketTestApp, TicketTestApp } from '../helpers/ticket-test-app';

const ENDPOINT = '/tickets/database/provisioning';
const USER_EMAIL = 'approver@example.com';

describe('PATCH /tickets/database/provisioning/:number/reject (e2e)', () => {
  let testApp: TicketTestApp;
  const infraHub = createInfraHubConnectorFake();
  const auth = authorizationHeaderFor({
    email: USER_EMAIL,
    roles: [Role.DATABASE_APPROVER],
  });

  beforeAll(async () => {
    testApp = await createTicketTestApp({
      modules: [UpdateTicketModule],
      overrides: [{ provide: InfraHubApiConnector, useValue: infraHub }],
    });
  });

  beforeEach(async () => {
    await testApp.resetTables();
    resetFake(infraHub);
  });

  afterAll(async () => {
    await testApp.close();
  });

  function call(number: number | string, authorization: string | null = auth) {
    const req = request(testApp.app.getHttpServer()).patch(
      ENDPOINT + '/' + number + '/reject',
    );
    if (authorization) {
      req.set('Authorization', authorization);
    }
    return req;
  }

  function findRow(id: number) {
    return testApp.dataSource
      .getRepository(DatabaseProvisioningTicketEntity)
      .findOneByOrFail({ id });
  }

  describe('reject', () => {
    it('returns 200 with the ticket now REJECTED', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource, {
        subject: 'To reject',
      });

      const response = await call(ticket.number).expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: ticket.id,
          number: ticket.number,
          subject: 'To reject',
          status: TicketStatus.REJECTED,
        }),
      );
    });

    it('persists the REJECTED status in the database', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);

      await call(ticket.number).expect(200);

      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.REJECTED);
    });

    it('keeps every other column of the ticket unchanged', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource, {
        subject: 'Keep me',
      });

      await call(ticket.number).expect(200);

      const row = await findRow(ticket.id);
      expect(row.number).toBe(ticket.number);
      expect(row.informer).toBe(ticket.informer);
      expect(row.assignee).toBe(ticket.assignee);
      expect(row.department).toBe(ticket.department);
      expect(row.subject).toBe('Keep me');
      expect(row.description).toBe(ticket.description);
      expect(row.dbNamespace).toBe(ticket.dbNamespace);
      expect(row.dbDeployment).toBe(ticket.dbDeployment);
      expect(row.newDbName).toBe(ticket.newDbName);
    });

    it('only updates the requested ticket', async () => {
      const untouched = await seedDatabaseProvisioningTicket(
        testApp.dataSource,
        { subject: 'Untouched' },
      );
      const target = await seedDatabaseProvisioningTicket(testApp.dataSource, {
        subject: 'Target',
      });

      await call(target.number).expect(200);

      const untouchedRow = await findRow(untouched.id);
      expect(untouchedRow.status).toBe(TicketStatus.OPEN);
      expect(untouchedRow.response).toBe('');
    });

    it('never calls infra-hub-api', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);

      await call(ticket.number).expect(200);

      expect(
        Object.values(callCounts(infraHub)).every((count) => count === 0),
      ).toBe(true);
    });

    it('leaves the ticket response untouched', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource, {
        response: 'previous note',
      });

      const response = await call(ticket.number).expect(200);

      expect(response.body.response).toBe('previous note');
      const row = await findRow(ticket.id);
      expect(row.response).toBe('previous note');
    });

    it('returns 409 on a second rejection', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);

      await call(ticket.number).expect(200);
      const response = await call(ticket.number).expect(409);

      expect(response.body.message).toBe(
        'Ticket with number ' +
          ticket.number +
          ' is already REJECTED, it cannot be rejected',
      );
    });

    it('returns 404 with the not-found message when the number does not exist', async () => {
      const response = await call(999).expect(404);

      expect(response.body).toEqual({
        statusCode: 404,
        message: 'Database provisioning ticket with number 999 not found',
        error: 'Not Found',
      });
      expect(
        Object.values(callCounts(infraHub)).every((count) => count === 0),
      ).toBe(true);
    });

    it('returns 404 when the number only exists in another ticket type', async () => {
      const foreign = await seedServerManagementTicket(testApp.dataSource);

      await call(foreign.number).expect(404);

      expect(
        Object.values(callCounts(infraHub)).every((count) => count === 0),
      ).toBe(true);
    });

    it('returns 409 when the ticket is already APPROVED and leaves it unchanged', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource, {
        status: TicketStatus.APPROVED,
        response: '{"success":true}',
      });

      const response = await call(ticket.number).expect(409);

      expect(response.body).toEqual({
        statusCode: 409,
        message:
          'Ticket with number ' +
          ticket.number +
          ' is already APPROVED, it cannot be rejected',
        error: 'Conflict',
      });
      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.APPROVED);
      expect(row.response).toBe('{"success":true}');
      expect(
        Object.values(callCounts(infraHub)).every((count) => count === 0),
      ).toBe(true);
    });

    it('returns 409 when the ticket is IN_PROGRESS and leaves it unchanged', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource, {
        status: TicketStatus.IN_PROGRESS,
      });

      const response = await call(ticket.number).expect(409);

      expect(response.body).toEqual({
        statusCode: 409,
        message:
          'Ticket with number ' +
          ticket.number +
          ' is already IN_PROGRESS, it cannot be rejected',
        error: 'Conflict',
      });
      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.IN_PROGRESS);
      expect(
        Object.values(callCounts(infraHub)).every((count) => count === 0),
      ).toBe(true);
    });

    it('returns 409 when the ticket is already REJECTED and leaves it unchanged', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource, {
        status: TicketStatus.REJECTED,
      });

      const response = await call(ticket.number).expect(409);

      expect(response.body.message).toBe(
        'Ticket with number ' +
          ticket.number +
          ' is already REJECTED, it cannot be rejected',
      );
      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.REJECTED);
      expect(
        Object.values(callCounts(infraHub)).every((count) => count === 0),
      ).toBe(true);
    });
  });

  describe('validation', () => {
    it('returns 400 when the number is not numeric and does not call infra-hub-api', async () => {
      const response = await call('abc').expect(400);

      expect(response.body).toEqual({
        statusCode: 400,
        message: 'Validation failed (numeric string is expected)',
        error: 'Bad Request',
      });
      expect(
        Object.values(callCounts(infraHub)).every((count) => count === 0),
      ).toBe(true);
    });

    it('returns 400 when the number is a decimal', async () => {
      await call('1.5').expect(400);
    });
  });

  describe('authorization', () => {
    it('returns 401 when the request has no bearer token', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      const response = await call(ticket.number, null).expect(401);

      expect(response.body.message).toBe('Missing or malformed bearer token');
    });

    it('returns 401 when the token is signed with an unknown key', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      const response = await call(
        ticket.number,
        'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Im90aGVyIn0.e30.invalid',
      ).expect(401);

      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('returns 403 when the user only has the COMMON_USER role', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
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
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      await call(
        ticket.number,
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.SERVER, Role.KUBERNATES_APPROVER],
        }),
      ).expect(403);
    });

    it('returns 403 when the token was issued for another application', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
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
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      const response = await call(
        ticket.number,
        authorizationHeaderForClaims({ email: 'user@example.com' }),
      ).expect(403);

      expect(response.body.message).toBe(
        'The token does not carry application information',
      );
    });

    it('returns 403 when the user only has the non-approver DATABASE role', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      const response = await call(
        ticket.number,
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.DATABASE],
        }),
      ).expect(403);

      expect(response.body.message).toBe('You do not have the required role');
    });

    it('does not touch the ticket nor infra-hub-api when the user is forbidden', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      await call(
        ticket.number,
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.COMMON_USER],
        }),
      ).expect(403);

      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.OPEN);
      expect(row.response).toBe('');
      expect(
        Object.values(callCounts(infraHub)).every((count) => count === 0),
      ).toBe(true);
    });

    it('accepts the ADMIN role', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      await call(
        ticket.number,
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.ADMIN] }),
      ).expect(200);
    });

    it('accepts the DATABASE_APPROVER role', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      await call(
        ticket.number,
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.DATABASE_APPROVER],
        }),
      ).expect(200);
    });
  });
});
