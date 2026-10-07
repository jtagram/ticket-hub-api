import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import request from 'supertest';
import { ServerManagementTicketEntity } from '../src/common/database/server-management-ticket/server-management-ticket.entity';
import { TicketStatus } from '../src/common/database/ticket-status.enum';
import { Role } from '../src/common/roles/role.enum';
import { AppTestApp, createAppTestApp } from './helpers/app-test-app';
import { infraHubSuccess, resetFake } from './helpers/outbound-fakes';
import { authorizationHeaderFor } from './helpers/test-auth';

// Smoke suite: the REAL AppModule (see helpers/app-test-app.ts for what is
// stubbed). Per-endpoint behavior is covered by the module-level e2e suites.
describe('AppModule (e2e smoke)', () => {
  let testApp: AppTestApp;
  const serverUser = authorizationHeaderFor({
    email: 'server.user@example.com',
    roles: [Role.SERVER],
  });
  const serverApprover = authorizationHeaderFor({
    email: 'approver@example.com',
    roles: [Role.SERVER_APPROVER],
  });

  beforeAll(async () => {
    testApp = await createAppTestApp();
  });

  beforeEach(async () => {
    await testApp.resetTables();
    resetFake(testApp.iam);
    resetFake(testApp.infraHub);
  });

  afterAll(async () => {
    await testApp.close();
  });

  function http() {
    return request(testApp.app.getHttpServer());
  }

  it('GET / returns Hello World without a token (public route)', async () => {
    const response = await http().get('/').expect(200);

    expect(response.text).toBe('Hello World!');
  });

  it('returns 401 on a protected route without a token', async () => {
    await http().get('/tickets/server/management').expect(401);
  });

  it('returns 403 when the token belongs to another application', async () => {
    const wrongApp = authorizationHeaderFor({
      email: 'server.user@example.com',
      roles: [Role.SERVER],
      applicationName: 'some-other-app',
    });

    expect(wrongApp).not.toBe(serverUser);
    await http()
      .get('/tickets/server/management')
      .set('Authorization', wrongApp)
      .expect(403);
  });

  it('returns 403 when the role is not allowed on the route', async () => {
    const kubernetesOnly = authorizationHeaderFor({
      email: 'k8s.user@example.com',
      roles: [Role.KUBERNATES],
    });

    await http()
      .get('/tickets/server/management')
      .set('Authorization', kubernetesOnly)
      .expect(403);
  });

  it('creates a ticket, lists it and approves it through the real wiring', async () => {
    const created = await http()
      .post('/tickets/server/management')
      .set('Authorization', serverUser)
      .send({
        informer: 'ignored@example.com',
        assignee: 'assignee@example.com',
        department: 'PLATFORM',
        subject: 'Restart web servers',
        description: 'Run the restart playbook',
        codeAnsible: '- hosts: all\n  tasks:\n    - ping:',
      })
      .expect(201);

    expect(created.body.status).toBe(TicketStatus.OPEN);
    const rows = await testApp.dataSource
      .getRepository(ServerManagementTicketEntity)
      .find();
    expect(rows).toHaveLength(1);
    expect(rows[0].number).toBe(created.body.number);

    const listed = await http()
      .get('/tickets/server/management')
      .set('Authorization', serverUser)
      .expect(200);
    expect(listed.body).toEqual([
      expect.objectContaining({
        number: created.body.number,
        subject: 'Restart web servers',
      }),
    ]);

    testApp.infraHub.manageServerCommand.mockResolvedValue(infraHubSuccess());
    const approved = await http()
      .patch(`/tickets/server/management/${created.body.number}/approve`)
      .set('Authorization', serverApprover)
      .expect(200);
    expect(approved.body.status).toBe(TicketStatus.APPROVED);
    expect(testApp.infraHub.manageServerCommand).toHaveBeenCalledTimes(1);

    const row = await testApp.dataSource
      .getRepository(ServerManagementTicketEntity)
      .findOneByOrFail({ id: created.body.id });
    expect(row.status).toBe(TicketStatus.APPROVED);
  });

  it('serves a value list from the stubbed infra-hub-api', async () => {
    testApp.infraHub.listDeployments.mockResolvedValue({
      deployments: ['postgres-main'],
    });
    const databaseUser = authorizationHeaderFor({
      email: 'db.user@example.com',
      roles: [Role.DATABASE],
    });

    const response = await http()
      .get('/search-for-value-lists/database-deployments')
      .query({ namespace: 'prod' })
      .set('Authorization', databaseUser)
      .expect(200);

    expect(response.body).toEqual([
      { value: 'postgres-main', label: 'postgres-main' },
    ]);
  });
});
