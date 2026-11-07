import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import { DatabaseProvisioningTicketEntity } from '../../src/common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { TicketStatus } from '../../src/common/database/ticket-status.enum';
import { Role } from '../../src/common/roles/role.enum';
import { CreateTicketTestApp, createCreateTicketTestApp } from '../helpers/create-ticket-test-app';
import { authorizationHeaderFor, authorizationHeaderForClaims } from '../helpers/test-auth';
import { httpServerOf } from '../helpers/http-server';
import { bodyOf, ErrorBody, SuccessBody } from '../helpers/response-types';

const ENDPOINT = '/tickets/database/provisioning';
const USER_EMAIL = 'database.user@example.com';

function validPayload(overrides: Record<string, unknown> = {}) {
	return {
		informer: 'client.sent@example.com',
		assignee: 'assignee@example.com',
		department: 'PLATFORM',
		subject: 'Provision billing database',
		description: 'Create the billing_reports database',
		dbNamespace: 'prod',
		dbDeployment: 'postgres-main',
		newDbName: 'billing_reports',
		...overrides,
	};
}

describe('POST /tickets/database/provisioning (e2e)', () => {
	let testApp: CreateTicketTestApp;
	const auth = authorizationHeaderFor({
		email: USER_EMAIL,
		roles: [Role.DATABASE],
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
		const req = request(httpServerOf(testApp.app)).post(ENDPOINT);
		if (authorization) {
			req.set('Authorization', authorization);
		}
		return req.send(body as object);
	}

	describe('creation', () => {
		it('returns 201 with the persisted ticket and stores it in the database', async () => {
			const response = await post(validPayload()).expect(201);

			expect(bodyOf<SuccessBody<unknown>>(response).data).toEqual(
				expect.objectContaining({
					id: expect.any(Number),
					number: expect.any(Number),
					informer: USER_EMAIL,
					assignee: 'assignee@example.com',
					department: 'PLATFORM',
					subject: 'Provision billing database',
					description: 'Create the billing_reports database',
					status: TicketStatus.OPEN,
					response: '',
					dbNamespace: 'prod',
					dbDeployment: 'postgres-main',
					newDbName: 'billing_reports',
				}),
			);

			const rows = await testApp.dataSource.getRepository(DatabaseProvisioningTicketEntity).find();
			expect(rows).toHaveLength(1);
			expect(rows[0].id).toBe(
				bodyOf<SuccessBody<DatabaseProvisioningTicketEntity>>(response).data.id,
			);
			expect(rows[0].number).toBe(
				bodyOf<SuccessBody<DatabaseProvisioningTicketEntity>>(response).data.number,
			);
			expect(rows[0].informer).toBe(USER_EMAIL);
			expect(rows[0].status).toBe(TicketStatus.OPEN);
			expect(rows[0].response).toBe('');
			expect(rows[0].newDbName).toBe('billing_reports');
		});

		it('assigns increasing numbers to successive tickets', async () => {
			const first = await post(validPayload()).expect(201);
			const second = await post(validPayload({ subject: 'Second' })).expect(201);
			const third = await post(validPayload({ subject: 'Third' })).expect(201);

			expect(
				bodyOf<SuccessBody<DatabaseProvisioningTicketEntity>>(second).data.number,
			).toBeGreaterThan(bodyOf<SuccessBody<DatabaseProvisioningTicketEntity>>(first).data.number);
			expect(
				bodyOf<SuccessBody<DatabaseProvisioningTicketEntity>>(third).data.number,
			).toBeGreaterThan(bodyOf<SuccessBody<DatabaseProvisioningTicketEntity>>(second).data.number);
		});

		it('ignores an informer sent in the body and stores the authenticated user email', async () => {
			const response = await post(validPayload({ informer: 'someone.else@example.com' })).expect(
				201,
			);

			expect(bodyOf<SuccessBody<DatabaseProvisioningTicketEntity>>(response).data.informer).toBe(
				USER_EMAIL,
			);
			const rows = await testApp.dataSource.getRepository(DatabaseProvisioningTicketEntity).find();
			expect(rows[0].informer).toBe(USER_EMAIL);
		});

		it('returns 400 when the informer sent in the body is not a valid email', async () => {
			const response = await post(validPayload({ informer: 'not-an-email' })).expect(400);

			expect(bodyOf<ErrorBody>(response).msg).toBe('informer must be an email');
		});
	});

	describe('validation', () => {
		it('returns 400 when a required field is missing', async () => {
			const { subject, ...payload } = validPayload();
			expect(subject).toBeDefined();

			const response = await post(payload).expect(400);

			expect(response.status).toBe(400);
			expect(bodyOf<ErrorBody>(response).msg).toContain('subject must be a string');
		});

		it('returns 400 when a field exceeds its maximum length', async () => {
			const response = await post(validPayload({ newDbName: 'a'.repeat(64) })).expect(400);

			expect(bodyOf<ErrorBody>(response).msg).toBe(
				'newDbName must be shorter than or equal to 63 characters',
			);
		});

		it('returns 400 when the body has an unknown property', async () => {
			const response = await post(validPayload({ unexpected: 'value' })).expect(400);

			expect(bodyOf<ErrorBody>(response).msg).toBe('property unexpected should not exist');
		});

		it('does not require the informer in the body (the token email is used)', async () => {
			const { informer, ...payload } = validPayload();
			expect(informer).toBeDefined();

			const response = await post(payload).expect(201);

			expect(bodyOf<SuccessBody<DatabaseProvisioningTicketEntity>>(response).data.informer).toBe(
				USER_EMAIL,
			);
			const rows = await testApp.dataSource.getRepository(DatabaseProvisioningTicketEntity).find();
			expect(rows).toHaveLength(1);
			expect(rows[0].informer).toBe(USER_EMAIL);
		});

		it('returns 400 when the informer is present but empty', async () => {
			const response = await post(validPayload({ informer: '' })).expect(400);

			expect(bodyOf<ErrorBody>(response).msg).toContain('informer must be an email');
		});

		it('returns 400 when newDbName has uppercase letters or dashes', async () => {
			const response = await post(validPayload({ newDbName: 'Billing-Reports' })).expect(400);

			expect(bodyOf<ErrorBody>(response).msg).toBe(
				'newDbName must be a valid lowercase Postgres identifier',
			);
		});

		it('returns 400 when newDbName starts with a digit', async () => {
			const response = await post(validPayload({ newDbName: '1billing' })).expect(400);

			expect(bodyOf<ErrorBody>(response).msg).toBe(
				'newDbName must be a valid lowercase Postgres identifier',
			);
		});

		it('accepts a newDbName that starts with an underscore and has digits', async () => {
			const response = await post(validPayload({ newDbName: '_billing_2024' })).expect(201);

			expect(bodyOf<SuccessBody<DatabaseProvisioningTicketEntity>>(response).data.newDbName).toBe(
				'_billing_2024',
			);
		});

		it('returns 400 when a field has the wrong type', async () => {
			const response = await post(validPayload({ dbNamespace: 123 })).expect(400);

			expect(bodyOf<ErrorBody>(response).msg).toContain('dbNamespace must be a string');
		});

		it('does not persist anything when validation fails', async () => {
			await post(validPayload({ unexpected: 'value' })).expect(400);

			const count = await testApp.dataSource
				.getRepository(DatabaseProvisioningTicketEntity)
				.count();
			expect(count).toBe(0);
		});

		it('returns 400 when a required field is whitespace only', async () => {
			const response = await post(validPayload({ subject: '   ' })).expect(400);

			expect(bodyOf<ErrorBody>(response).msg).toBe('subject must not be blank');
			const count = await testApp.dataSource
				.getRepository(DatabaseProvisioningTicketEntity)
				.count();
			expect(count).toBe(0);
		});

		it('returns 400 when dbNamespace is whitespace only', async () => {
			const response = await post(validPayload({ dbNamespace: '   ' })).expect(400);

			expect(bodyOf<ErrorBody>(response).msg).toBe('dbNamespace must not be blank');
			const count = await testApp.dataSource
				.getRepository(DatabaseProvisioningTicketEntity)
				.count();
			expect(count).toBe(0);
		});

		it('returns 400 when description is made only of tabs and line breaks', async () => {
			const response = await post(validPayload({ description: ' \t\r\n ' })).expect(400);

			expect(bodyOf<ErrorBody>(response).msg).toBe('description must not be blank');
			const count = await testApp.dataSource
				.getRepository(DatabaseProvisioningTicketEntity)
				.count();
			expect(count).toBe(0);
		});
	});

	describe('authorization', () => {
		it('returns 401 when the request has no bearer token', async () => {
			const response = await post(validPayload(), null).expect(401);

			expect(bodyOf<ErrorBody>(response).msg).toBe('Missing or malformed bearer token');
		});

		it('returns 401 when the token is signed with an unknown key', async () => {
			const response = await post(
				validPayload(),
				'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Im90aGVyIn0.e30.invalid',
			).expect(401);

			expect(bodyOf<ErrorBody>(response).msg).toBe('Invalid or expired token');
		});

		it('returns 403 when the user only has the COMMON_USER role', async () => {
			const response = await post(
				validPayload(),
				authorizationHeaderFor({
					email: USER_EMAIL,
					roles: [Role.COMMON_USER],
				}),
			).expect(403);

			expect(bodyOf<ErrorBody>(response).msg).toBe('You do not have the required role');
		});

		it('returns 403 when the user only has roles of another domain', async () => {
			await post(
				validPayload(),
				authorizationHeaderFor({
					email: USER_EMAIL,
					roles: [Role.SERVER, Role.KUBERNATES_APPROVER],
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

			expect(bodyOf<ErrorBody>(response).msg).toBe(
				'This token was not issued for the ticket-hub-api application',
			);
		});

		it('returns 403 when the verified token carries no apps claim', async () => {
			const response = await post(
				validPayload(),
				authorizationHeaderForClaims({ email: 'user@example.com' }),
			).expect(403);

			expect(bodyOf<ErrorBody>(response).msg).toBe(
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
				.getRepository(DatabaseProvisioningTicketEntity)
				.count();
			expect(count).toBe(0);
		});

		it('accepts the ADMIN role', async () => {
			await post(
				validPayload(),
				authorizationHeaderFor({ email: USER_EMAIL, roles: [Role.ADMIN] }),
			).expect(201);
		});

		it('accepts the DATABASE_APPROVER role', async () => {
			await post(
				validPayload(),
				authorizationHeaderFor({
					email: USER_EMAIL,
					roles: [Role.DATABASE_APPROVER],
				}),
			).expect(201);
		});
	});
});
