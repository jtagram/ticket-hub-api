import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { HttpException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import request from 'supertest';
import { DatabaseProvisioningTicketEntity } from '../../src/common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { DatabaseProvisioningTicketsRepository } from '../../src/common/database/database-provisioning-ticket/database-provisioning-tickets.repository';
import { TicketStatus } from '../../src/common/database/ticket-status.enum';
import { Role } from '../../src/common/roles/role.enum';
import { InfraHubApiConnector } from '../../src/modules/infra-hub-api/infra-hub-api.connector';
import { UpdateTicketModule } from '../../src/modules/update-ticket/update-ticket.module';
import { createBarrier } from '../helpers/concurrency';
import {
  callCounts,
  createInfraHubConnectorFake,
  infraHubFailure,
  infraHubSuccess,
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

describe('PATCH /tickets/database/provisioning/:number/approve (e2e)', () => {
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
      ENDPOINT + '/' + number + '/approve',
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

  describe('approve', () => {
    it('returns 200 with the ticket now APPROVED', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource, {
        subject: 'To approve',
      });
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());

      const response = await call(ticket.number).expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: ticket.id,
          number: ticket.number,
          subject: 'To approve',
          status: TicketStatus.APPROVED,
        }),
      );
    });

    it('persists the APPROVED status in the database', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());

      await call(ticket.number).expect(200);

      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.APPROVED);
    });

    it('keeps every other column of the ticket unchanged', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource, {
        subject: 'Keep me',
      });
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());

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
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());

      await call(target.number).expect(200);

      const untouchedRow = await findRow(untouched.id);
      expect(untouchedRow.status).toBe(TicketStatus.OPEN);
      expect(untouchedRow.response).toBe('');
    });

    it('sends the mapped request to the matching infra-hub-api operation only', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());

      await call(ticket.number).expect(200);

      expect(infraHub.createDatabase).toHaveBeenCalledTimes(1);
      expect(infraHub.createDatabase).toHaveBeenCalledWith({
        numberOfTickets: ticket.number,
        namespace: ticket.dbNamespace,
        deployment: ticket.dbDeployment,
        dbName: ticket.newDbName,
      });
      expect(infraHub.manageServerCommand).not.toHaveBeenCalled();
      expect(infraHub.manageKubernetesManifest).not.toHaveBeenCalled();
      expect(infraHub.executeKubectlCommand).not.toHaveBeenCalled();
      expect(infraHub.manageDatabase).not.toHaveBeenCalled();
      expect(infraHub.listDeployments).not.toHaveBeenCalled();
      expect(infraHub.listDatabases).not.toHaveBeenCalled();
    });

    it('stores the serialized execution result, not the whole infra-hub-api payload, as the response', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      const payload = infraHubSuccess('applied 3 changes');
      infraHub.createDatabase.mockResolvedValue(payload);

      const response = await call(ticket.number).expect(200);

      expect(response.body.response).toBe(
        JSON.stringify(payload.executionResult),
      );
      expect(response.body.response).not.toContain('logId');
      const row = await findRow(ticket.id);
      expect(row.response).toBe(JSON.stringify(payload.executionResult));
    });

    it('answers 502 and does not approve when infra-hub-api reports success false', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockResolvedValue(infraHubFailure());

      const response = await call(ticket.number).expect(502);

      expect(response.body).toEqual({
        statusCode: 502,
        message:
          'infra-hub-api reported that the execution for Database provisioning ticket ' +
          ticket.number +
          ' failed. The ticket stays IN_PROGRESS and the execution result was saved in its response; it will not be executed again.',
        error: 'Bad Gateway',
      });
    });

    it('keeps the ticket IN_PROGRESS and stores the failed execution result in its response', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      const failure = infraHubFailure('boom');
      infraHub.createDatabase.mockResolvedValue(failure);

      await call(ticket.number).expect(502);

      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.IN_PROGRESS);
      expect(row.response).toBe(JSON.stringify(failure.executionResult));
    });

    it('cannot be approved again after a failed execution', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockResolvedValueOnce(infraHubFailure());
      infraHub.createDatabase.mockResolvedValueOnce(
        infraHubSuccess('second run'),
      );

      await call(ticket.number).expect(502);
      const retry = await call(ticket.number).expect(409);

      expect(retry.body.message).toBe(
        'Ticket with number ' +
          ticket.number +
          ' is already IN_PROGRESS, it cannot be approved',
      );
      expect(infraHub.createDatabase).toHaveBeenCalledTimes(1);
      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.IN_PROGRESS);
      expect(row.response).toBe(
        JSON.stringify(infraHubFailure().executionResult),
      );
    });

    it('answers 500 saying the action WAS executed when the status update fails afterwards', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());
      const updateSpy = jest
        .spyOn(
          testApp.app.get(DatabaseProvisioningTicketsRepository, {
            strict: false,
          }),
          'update',
        )
        .mockRejectedValueOnce(new Error('connection lost'));

      try {
        const response = await call(ticket.number).expect(500);

        expect(response.body).toEqual({
          statusCode: 500,
          message:
            'The action of Database provisioning ticket ' +
            ticket.number +
            ' WAS executed by infra-hub-api, but the ticket status could not be saved and it is still IN_PROGRESS. ' +
            'Do not approve it again: contact an administrator to reconcile it.',
          error: 'Internal Server Error',
        });
        expect(updateSpy).toHaveBeenCalledTimes(1);
      } finally {
        updateSpy.mockRestore();
      }

      expect(infraHub.createDatabase).toHaveBeenCalledTimes(1);
      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.IN_PROGRESS);
      expect(row.response).toBe('');
    });

    it('logs the ticket, the execution result and the error when the status update fails afterwards', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      const success = infraHubSuccess();
      infraHub.createDatabase.mockResolvedValue(success);
      const updateSpy = jest
        .spyOn(
          testApp.app.get(DatabaseProvisioningTicketsRepository, {
            strict: false,
          }),
          'update',
        )
        .mockRejectedValueOnce(new Error('connection lost'));
      const logSpy = jest.spyOn(testApp.app.get(Logger), 'error');

      try {
        await call(ticket.number).expect(500);

        expect(logSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            ticketType: 'Database provisioning',
            ticketNumber: ticket.number,
            executionResult: success.executionResult,
            err: expect.objectContaining({ message: 'connection lost' }),
          }),
        );
      } finally {
        updateSpy.mockRestore();
        logSpy.mockRestore();
      }
    });

    it('returns 409 on a second approval and calls infra-hub-api only once', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());

      await call(ticket.number).expect(200);
      const response = await call(ticket.number).expect(409);

      expect(response.body.message).toBe(
        'Ticket with number ' +
          ticket.number +
          ' is already APPROVED, it cannot be approved',
      );
      expect(infraHub.createDatabase).toHaveBeenCalledTimes(1);
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
          ' is already APPROVED, it cannot be approved',
        error: 'Conflict',
      });
      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.APPROVED);
      expect(row.response).toBe('{"success":true}');
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
          ' is already REJECTED, it cannot be approved',
      );
      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.REJECTED);
      expect(
        Object.values(callCounts(infraHub)).every((count) => count === 0),
      ).toBe(true);
    });
  });

  describe('claim and IN_PROGRESS', () => {
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
          ' is already IN_PROGRESS, it cannot be approved',
        error: 'Conflict',
      });
      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.IN_PROGRESS);
      expect(
        Object.values(callCounts(infraHub)).every((count) => count === 0),
      ).toBe(true);
    });

    it('moves the ticket to IN_PROGRESS while infra-hub-api is executing', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      let statusDuringExecution: TicketStatus | undefined;
      infraHub.createDatabase.mockImplementation(async () => {
        statusDuringExecution = (await findRow(ticket.id)).status;
        return infraHubSuccess();
      });

      await call(ticket.number).expect(200);

      expect(statusDuringExecution).toBe(TicketStatus.IN_PROGRESS);
    });

    it('lets exactly one of two simultaneous approvals through and calls infra-hub-api once', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      const repository = testApp.app.get(
        DatabaseProvisioningTicketsRepository,
        { strict: false },
      );
      const originalFindByNumber = repository.findByNumber.bind(repository);
      // Both requests read the ticket as OPEN before either of them claims it.
      const bothHaveRead = createBarrier(2);
      const findSpy = jest
        .spyOn(repository, 'findByNumber')
        .mockImplementation(async (number: number) => {
          const found = await originalFindByNumber(number);
          await bothHaveRead.arrive();
          return found;
        });
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());

      try {
        const [first, second] = await Promise.all([
          call(ticket.number),
          call(ticket.number),
        ]);

        expect([first.status, second.status].sort()).toEqual([200, 409]);
        const loser = first.status === 409 ? first : second;
        expect(loser.body.message).toBe(
          'Ticket with number ' +
            ticket.number +
            ' could not be approved: it was claimed by another request or it is no longer OPEN',
        );
      } finally {
        findSpy.mockRestore();
      }

      expect(infraHub.createDatabase).toHaveBeenCalledTimes(1);
      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.APPROVED);
    });

    it('leaves the ticket IN_PROGRESS and answers 409 on retry after an unknown infra-hub-api failure', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockRejectedValueOnce(new Error('timeout'));

      await call(ticket.number).expect(500);
      const retry = await call(ticket.number).expect(409);

      expect(retry.body.message).toBe(
        'Ticket with number ' +
          ticket.number +
          ' is already IN_PROGRESS, it cannot be approved',
      );
      expect(infraHub.createDatabase).toHaveBeenCalledTimes(1);
    });

    it('logs an error with the ticket and the cause after an unknown infra-hub-api failure', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockRejectedValue(new Error('socket hang up'));
      const logSpy = jest.spyOn(testApp.app.get(Logger), 'error');

      try {
        await call(ticket.number).expect(500);

        expect(logSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            ticketType: 'Database provisioning',
            ticketNumber: ticket.number,
            err: expect.objectContaining({ message: 'socket hang up' }),
          }),
        );
      } finally {
        logSpy.mockRestore();
      }
    });

    it('leaves the ticket IN_PROGRESS when infra-hub-api rejects the request with a 4xx', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockRejectedValue(
        new HttpException({ statusCode: 403, message: 'Forbidden' }, 403),
      );

      await call(ticket.number).expect(403);

      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.IN_PROGRESS);
      expect(row.response).toBe('');
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

  describe('infra-hub-api failures', () => {
    it('forwards the status and body of an infra-hub-api 502 and leaves the ticket IN_PROGRESS', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockRejectedValue(
        new HttpException(
          { statusCode: 502, message: 'Bad gateway from infra-hub-api' },
          502,
        ),
      );

      const response = await call(ticket.number).expect(502);

      expect(response.body).toEqual({
        statusCode: 502,
        message: 'Bad gateway from infra-hub-api',
      });
      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.IN_PROGRESS);
      expect(row.response).toBe('');
    });

    it('forwards the status and body of an infra-hub-api 4xx and leaves the ticket IN_PROGRESS', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockRejectedValue(
        new HttpException(
          { statusCode: 422, message: 'The request payload is invalid' },
          422,
        ),
      );

      const response = await call(ticket.number).expect(422);

      expect(response.body.message).toBe('The request payload is invalid');
      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('answers 500 with the generic message when the call fails without an HTTP response and leaves the ticket IN_PROGRESS', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockRejectedValue(
        new Error('connect ECONNREFUSED'),
      );

      const response = await call(ticket.number).expect(500);

      expect(response.body).toEqual({
        statusCode: 500,
        message: 'An unexpected error occurred. Please try again later.',
      });
      const row = await findRow(ticket.id);
      expect(row.status).toBe(TicketStatus.IN_PROGRESS);
      expect(row.response).toBe('');
    });

    it('does not allow approving again after infra-hub-api rejected the request', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockRejectedValueOnce(
        new HttpException({ statusCode: 400, message: 'Bad request' }, 400),
      );
      infraHub.createDatabase.mockResolvedValueOnce(infraHubSuccess());

      await call(ticket.number).expect(400);
      const retry = await call(ticket.number).expect(409);

      expect(retry.body.message).toBe(
        'Ticket with number ' +
          ticket.number +
          ' is already IN_PROGRESS, it cannot be approved',
      );
      expect(infraHub.createDatabase).toHaveBeenCalledTimes(1);
    });
  });

  describe('authorization', () => {
    it('returns 401 when the request has no bearer token', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());
      const response = await call(ticket.number, null).expect(401);

      expect(response.body.message).toBe('Missing or malformed bearer token');
    });

    it('returns 401 when the token is signed with an unknown key', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());
      const response = await call(
        ticket.number,
        'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Im90aGVyIn0.e30.invalid',
      ).expect(401);

      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('returns 403 when the user only has the COMMON_USER role', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());
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
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());
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
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());
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
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());
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
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());
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
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());
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
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());
      await call(
        ticket.number,
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.ADMIN] }),
      ).expect(200);
    });

    it('accepts the DATABASE_APPROVER role', async () => {
      const ticket = await seedDatabaseProvisioningTicket(testApp.dataSource);
      infraHub.createDatabase.mockResolvedValue(infraHubSuccess());
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
