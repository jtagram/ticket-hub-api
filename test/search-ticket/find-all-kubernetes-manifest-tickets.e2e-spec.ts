import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import request from 'supertest';
import { KubernetesManifestTicketEntity } from '../../src/common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { TicketStatus } from '../../src/common/database/ticket-status.enum';
import { Role } from '../../src/common/roles/role.enum';
import { SearchTicketModule } from '../../src/modules/search-ticket/search-ticket.module';
import {
  authorizationHeaderFor,
  authorizationHeaderForClaims,
} from '../helpers/test-auth';
import {
  seedKubernetesManifestTicket,
  seedKubectlCommandTicket,
} from '../helpers/ticket-fixtures';
import { createTicketTestApp, TicketTestApp } from '../helpers/ticket-test-app';

const ENDPOINT = '/tickets/kubernetes/manifest';
const USER_EMAIL = 'user@example.com';

describe('GET /tickets/kubernetes/manifest (e2e)', () => {
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

  function call(authorization: string | null = auth) {
    const req = request(testApp.app.getHttpServer()).get(ENDPOINT);
    if (authorization) {
      req.set('Authorization', authorization);
    }
    return req;
  }

  describe('listing', () => {
    it('returns 200 with an empty array when there are no tickets', async () => {
      const response = await call().expect(200);

      expect(response.body).toEqual([]);
    });

    it('returns 200 with every persisted ticket', async () => {
      const first = await seedKubernetesManifestTicket(testApp.dataSource, {
        subject: 'First',
      });
      const second = await seedKubernetesManifestTicket(testApp.dataSource, {
        subject: 'Second',
      });

      const response = await call().expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toEqual(
        expect.objectContaining({
          id: first.id,
          number: first.number,
          subject: 'First',
          status: TicketStatus.OPEN,
          response: '',
          informer: 'informer@example.com',
          assignee: 'assignee@example.com',
          namespace: first.namespace,
        }),
      );
      expect(response.body[1]).toEqual(
        expect.objectContaining({
          id: second.id,
          number: second.number,
          subject: 'Second',
        }),
      );
    });

    it('includes the audit timestamps of every ticket', async () => {
      await seedKubernetesManifestTicket(testApp.dataSource);

      const response = await call().expect(200);

      expect(typeof response.body[0].createdAt).toBe('string');
      expect(typeof response.body[0].updatedAt).toBe('string');
    });

    it('orders the tickets by number ascending regardless of insertion order', async () => {
      // The number is generated on insert, so it is rewritten afterwards to make
      // the insertion order differ from the numeric order.
      const repository = testApp.dataSource.getRepository(
        KubernetesManifestTicketEntity,
      );
      const inserted = await seedKubernetesManifestTicket(testApp.dataSource, {
        subject: 'Third',
      });
      const middle = await seedKubernetesManifestTicket(testApp.dataSource, {
        subject: 'Second',
      });
      const last = await seedKubernetesManifestTicket(testApp.dataSource, {
        subject: 'First',
      });
      await repository.update(inserted.id, { number: 300 });
      await repository.update(middle.id, { number: 200 });
      await repository.update(last.id, { number: 100 });

      const response = await call().expect(200);

      expect(
        response.body.map((ticket: { number: number }) => ticket.number),
      ).toEqual([100, 200, 300]);
      expect(
        response.body.map((ticket: { subject: string }) => ticket.subject),
      ).toEqual(['First', 'Second', 'Third']);
    });

    it('returns tickets in every status', async () => {
      await seedKubernetesManifestTicket(testApp.dataSource, {
        status: TicketStatus.OPEN,
      });
      await seedKubernetesManifestTicket(testApp.dataSource, {
        status: TicketStatus.IN_PROGRESS,
      });
      await seedKubernetesManifestTicket(testApp.dataSource, {
        status: TicketStatus.APPROVED,
      });
      await seedKubernetesManifestTicket(testApp.dataSource, {
        status: TicketStatus.REJECTED,
      });

      const response = await call().expect(200);

      expect(
        response.body.map((ticket: { status: string }) => ticket.status),
      ).toEqual([
        TicketStatus.OPEN,
        TicketStatus.IN_PROGRESS,
        TicketStatus.APPROVED,
        TicketStatus.REJECTED,
      ]);
    });

    it('does not include tickets of other types', async () => {
      await seedKubectlCommandTicket(testApp.dataSource, {
        subject: 'Another type',
      });

      const response = await call().expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('authorization', () => {
    it('returns 401 when the request has no bearer token', async () => {
      const response = await call(null).expect(401);

      expect(response.body.message).toBe('Missing or malformed bearer token');
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
    });

    it('returns 403 when the user only has roles of another domain', async () => {
      await call(
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.DATABASE, Role.SERVER_APPROVER],
        }),
      ).expect(403);
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
    });

    it('returns 403 when the verified token carries no apps claim', async () => {
      const response = await call(
        authorizationHeaderForClaims({ email: 'user@example.com' }),
      ).expect(403);

      expect(response.body.message).toBe(
        'The token does not carry application information',
      );
    });

    it('accepts the ADMIN role', async () => {
      await call(
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.ADMIN] }),
      ).expect(200);
    });

    it('accepts the KUBERNATES role', async () => {
      await call(
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.KUBERNATES] }),
      ).expect(200);
    });

    it('accepts the KUBERNATES_APPROVER role', async () => {
      await call(
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.KUBERNATES_APPROVER],
        }),
      ).expect(200);
    });
  });
});
