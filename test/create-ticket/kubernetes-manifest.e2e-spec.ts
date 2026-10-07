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
import { KubernetesTicketAction } from '../../src/common/database/kubernetes-ticket/kubernetes-ticket-action.enum';
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

const ENDPOINT = '/tickets/kubernetes/manifest';
const USER_EMAIL = 'kubernetes.user@example.com';

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    informer: 'client.sent@example.com',
    assignee: 'assignee@example.com',
    department: 'PLATFORM',
    subject: 'Apply config map',
    description: 'Apply the payments config map',
    namespace: 'payments',
    action: 'apply',
    codeYaml: 'apiVersion: v1\nkind: ConfigMap',
    ...overrides,
  };
}

describe('POST /tickets/kubernetes/manifest (e2e)', () => {
  let testApp: CreateTicketTestApp;
  const auth = authorizationHeaderFor({
    email: USER_EMAIL,
    roles: [Role.KUBERNATES],
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
          subject: 'Apply config map',
          description: 'Apply the payments config map',
          status: TicketStatus.OPEN,
          response: '',
          namespace: 'payments',
          action: 'apply',
          codeYaml: 'apiVersion: v1\nkind: ConfigMap',
        }),
      );

      const rows = await testApp.dataSource
        .getRepository(KubernetesManifestTicketEntity)
        .find();
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(response.body.id);
      expect(rows[0].number).toBe(response.body.number);
      expect(rows[0].informer).toBe(USER_EMAIL);
      expect(rows[0].status).toBe(TicketStatus.OPEN);
      expect(rows[0].response).toBe('');
      expect(rows[0].action).toBe(KubernetesTicketAction.APPLY);
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
        .getRepository(KubernetesManifestTicketEntity)
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
        validPayload({ namespace: 'a'.repeat(51) }),
      ).expect(400);

      expect(response.body.message).toEqual([
        'namespace must be shorter than or equal to 50 characters',
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
        .getRepository(KubernetesManifestTicketEntity)
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

    it('returns 400 when the action is not one of the allowed values', async () => {
      const response = await post(validPayload({ action: 'patch' })).expect(
        400,
      );

      expect(response.body.message).toEqual([
        'action must be one of the following values: apply, delete, create',
      ]);
    });

    it('returns 400 when the action is missing', async () => {
      const { action, ...payload } = validPayload();
      expect(action).toBeDefined();

      const response = await post(payload).expect(400);

      expect(response.body.message).toEqual([
        'action must be one of the following values: apply, delete, create',
      ]);
    });

    it('accepts the delete action', async () => {
      const response = await post(validPayload({ action: 'delete' })).expect(
        201,
      );

      expect(response.body.action).toBe(KubernetesTicketAction.DELETE);
    });

    it('accepts the create action', async () => {
      const response = await post(validPayload({ action: 'create' })).expect(
        201,
      );

      expect(response.body.action).toBe(KubernetesTicketAction.CREATE);
    });

    it('returns 400 when a field has the wrong type', async () => {
      const response = await post(validPayload({ codeYaml: 123 })).expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining(['codeYaml must be a string']),
      );
    });

    it('does not persist anything when validation fails', async () => {
      await post(validPayload({ unexpected: 'value' })).expect(400);

      const count = await testApp.dataSource
        .getRepository(KubernetesManifestTicketEntity)
        .count();
      expect(count).toBe(0);
    });

    it('returns 400 when a required field is whitespace only', async () => {
      const response = await post(validPayload({ subject: '   ' })).expect(400);

      expect(response.body.message).toEqual(['subject must not be blank']);
      const count = await testApp.dataSource
        .getRepository(KubernetesManifestTicketEntity)
        .count();
      expect(count).toBe(0);
    });

    it('returns 400 when codeYaml is whitespace only', async () => {
      const response = await post(validPayload({ codeYaml: '   ' })).expect(
        400,
      );

      expect(response.body.message).toEqual(['codeYaml must not be blank']);
      const count = await testApp.dataSource
        .getRepository(KubernetesManifestTicketEntity)
        .count();
      expect(count).toBe(0);
    });

    it('returns 400 when description is made only of tabs and line breaks', async () => {
      const response = await post(
        validPayload({ description: ' \t\r\n ' }),
      ).expect(400);

      expect(response.body.message).toEqual(['description must not be blank']);
      const count = await testApp.dataSource
        .getRepository(KubernetesManifestTicketEntity)
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
          roles: [Role.DATABASE, Role.SERVER],
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
        .getRepository(KubernetesManifestTicketEntity)
        .count();
      expect(count).toBe(0);
    });

    it('accepts the ADMIN role', async () => {
      await post(
        validPayload(),
        authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.ADMIN] }),
      ).expect(201);
    });

    it('accepts the KUBERNATES_APPROVER role', async () => {
      await post(
        validPayload(),
        authorizationHeaderFor({
          email: USER_EMAIL,
          roles: [Role.KUBERNATES_APPROVER],
        }),
      ).expect(201);
    });
  });
});
