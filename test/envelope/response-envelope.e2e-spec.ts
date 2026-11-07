import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { Role } from '../../src/common/roles/role.enum';
import { CreateTicketModule } from '../../src/modules/create-ticket/create-ticket.module';
import { IamApiConnector } from '../../src/modules/iam-api/iam-api.connector';
import { SearchForValueListsModule } from '../../src/modules/search-for-value-lists/search-for-value-lists.module';
import { SearchTicketModule } from '../../src/modules/search-ticket/search-ticket.module';
import { UpdateTicketModule } from '../../src/modules/update-ticket/update-ticket.module';
import { httpServerOf } from '../helpers/http-server';
import {
	createIamConnectorFake,
	createInfraHubConnectorFake,
	infraHubOverrides,
	infraHubSuccess,
	resetFake,
} from '../helpers/outbound-fakes';
import { authorizationHeaderFor } from '../helpers/test-auth';
import { seedServerManagementTicket } from '../helpers/ticket-fixtures';
import { createTicketTestApp, TicketTestApp } from '../helpers/ticket-test-app';

/** One check per endpoint family of the exact `{ ok, msg, data }` contract. */
describe('response envelope (e2e)', () => {
	let testApp: TicketTestApp;
	const iam = createIamConnectorFake();
	const infraHub = createInfraHubConnectorFake();
	const auth = authorizationHeaderFor({ email: 'admin@example.com', roles: [Role.ADMIN] });

	beforeAll(async () => {
		testApp = await createTicketTestApp({
			modules: [
				CreateTicketModule,
				SearchTicketModule,
				UpdateTicketModule,
				SearchForValueListsModule,
			],
			overrides: [{ provide: IamApiConnector, useValue: iam }, ...infraHubOverrides(infraHub)],
		});
	});

	beforeEach(async () => {
		await testApp.resetTables();
		resetFake(iam);
		resetFake(infraHub);
	});

	afterAll(async () => {
		await testApp.close();
	});

	const http = () => httpServerOf(testApp.app);

	it('POST create answers 201 { ok: true, msg, data: ticket }', async () => {
		const response = await request(http())
			.post('/tickets/server/management')
			.set('Authorization', auth)
			.send({
				assignee: 'a@example.com',
				department: 'PLATFORM',
				subject: 'Subject',
				description: 'Description',
				codeAnsible: '- ping:',
			})
			.expect(201);

		expect(response.body).toEqual({
			ok: true,
			msg: 'Server management ticket created',
			data: expect.objectContaining({ subject: 'Subject', status: 'OPEN' }),
		});
	});

	it('GET list answers 200 with the tickets in data', async () => {
		await seedServerManagementTicket(testApp.dataSource);

		const response = await request(http())
			.get('/tickets/server/management')
			.set('Authorization', auth)
			.expect(200);

		expect(response.body).toMatchObject({ ok: true, msg: 'Server management tickets retrieved' });
		expect(response.body).toHaveProperty('data.length', 1);
	});

	it('GET by number answers 200 with the ticket in data', async () => {
		const ticket = await seedServerManagementTicket(testApp.dataSource);

		const response = await request(http())
			.get(`/tickets/server/management/${ticket.number}`)
			.set('Authorization', auth)
			.expect(200);

		expect(response.body).toMatchObject({
			ok: true,
			msg: 'Server management ticket retrieved',
			data: { number: ticket.number },
		});
	});

	it('PATCH approve answers 200 with the approved ticket in data', async () => {
		const ticket = await seedServerManagementTicket(testApp.dataSource);
		infraHub.manageServerCommand.mockResolvedValue(infraHubSuccess());

		const response = await request(http())
			.patch(`/tickets/server/management/${ticket.number}/approve`)
			.set('Authorization', auth)
			.expect(200);

		expect(response.body).toMatchObject({
			ok: true,
			msg: 'Server management ticket approved',
			data: { number: ticket.number, status: 'APPROVED' },
		});
	});

	it('PATCH reject answers 200 with the rejected ticket in data', async () => {
		const ticket = await seedServerManagementTicket(testApp.dataSource);

		const response = await request(http())
			.patch(`/tickets/server/management/${ticket.number}/reject`)
			.set('Authorization', auth)
			.expect(200);

		expect(response.body).toMatchObject({
			ok: true,
			msg: 'Server management ticket rejected',
			data: { number: ticket.number, status: 'REJECTED' },
		});
	});

	it('GET value lists answer 200 with value-label pairs in data', async () => {
		iam.findInternalUsersByRole.mockResolvedValue([
			{ id: 1, name: 'Ada', lastname: 'Lovelace', email: 'ada@example.com' },
		]);
		infraHub.listDeployments.mockResolvedValue({ deployments: ['pg'] });
		infraHub.listDatabases.mockResolvedValue({ databases: ['orders'] });

		const assignees = await request(http())
			.get('/search-for-value-lists/assignees')
			.set('Authorization', auth)
			.expect(200);
		const deployments = await request(http())
			.get('/search-for-value-lists/database-deployments')
			.query({ namespace: 'prod' })
			.set('Authorization', auth)
			.expect(200);
		const names = await request(http())
			.get('/search-for-value-lists/database-names')
			.query({ namespace: 'prod', deployment: 'pg' })
			.set('Authorization', auth)
			.expect(200);

		expect(assignees.body).toEqual({
			ok: true,
			msg: 'Assignees retrieved successfully',
			data: [{ value: 'ada@example.com', label: 'Ada Lovelace (ada@example.com)' }],
		});
		expect(deployments.body).toEqual({
			ok: true,
			msg: 'Database deployments retrieved successfully',
			data: [{ value: 'pg', label: 'pg' }],
		});
		expect(names.body).toEqual({
			ok: true,
			msg: 'Database names retrieved successfully',
			data: [{ value: 'orders', label: 'orders' }],
		});
	});

	it('errors answer { ok: false, msg, data: null } with the original status', async () => {
		const response = await request(http())
			.get('/tickets/server/management/999')
			.set('Authorization', auth)
			.expect(404);

		expect(response.body).toEqual({
			ok: false,
			msg: 'Server management ticket with number 999 not found',
			data: null,
		});
	});
});
