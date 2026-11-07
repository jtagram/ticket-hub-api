import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ArgumentsHost } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { QueryFailedError, TypeORMError } from 'typeorm';
import { ResponseBody } from '../../dto/response-body.dto';
import { DatabaseExceptionFilter } from '../database-exception.filter';
import { GENERIC_ERROR_MESSAGE } from '../generic-error-message';

describe('DatabaseExceptionFilter', () => {
	let logger: { error: jest.Mock; warn: jest.Mock };
	let json: jest.Mock;
	let status: jest.Mock;
	let host: ArgumentsHost;
	let filter: DatabaseExceptionFilter;

	beforeEach(() => {
		logger = { error: jest.fn(), warn: jest.fn() };
		json = jest.fn();
		status = jest.fn().mockReturnValue({ json });
		host = {
			switchToHttp: () => ({ getResponse: () => ({ status }) }),
		} as unknown as ArgumentsHost;
		filter = new DatabaseExceptionFilter(logger as unknown as Logger);
	});

	it('answers 500 with the generic message', () => {
		filter.catch(new TypeORMError('connection lost'), host);

		expect(status).toHaveBeenCalledWith(500);
		expect(json).toHaveBeenCalledWith(ResponseBody.failure(GENERIC_ERROR_MESSAGE));
		expect(json).toHaveBeenCalledWith({ ok: false, msg: GENERIC_ERROR_MESSAGE, data: null });
	});

	it('answers 409 with a generic message on a Postgres unique violation (23505)', () => {
		const driverError = Object.assign(
			new Error('duplicate key value violates unique constraint "UQ_tickets_number"'),
			{ code: '23505' },
		);
		const error = new QueryFailedError('INSERT INTO tickets ...', [], driverError);

		filter.catch(error, host);

		expect(status).toHaveBeenCalledWith(409);
		expect(json).toHaveBeenCalledWith({
			ok: false,
			msg: 'The resource conflicts with an existing one',
			data: null,
		});
		expect(JSON.stringify(json.mock.calls)).not.toContain('UQ_tickets_number');
		expect(logger.warn).toHaveBeenCalledTimes(1);
		expect(logger.error).not.toHaveBeenCalled();
	});

	it('keeps answering 500 for other Postgres error codes', () => {
		const driverError = Object.assign(new Error('not null'), { code: '23502' });

		filter.catch(new QueryFailedError('INSERT', [], driverError), host);

		expect(status).toHaveBeenCalledWith(500);
	});

	it('does not expose the database error message nor the query to the client', () => {
		const error = new QueryFailedError(
			'SELECT secret FROM users',
			[],
			new Error('relation "users" does not exist'),
		);

		filter.catch(error, host);

		const body = JSON.stringify(json.mock.calls);
		expect(body).not.toContain('users');
		expect(body).not.toContain('SELECT');
	});

	it('logs message, stack and class name of a generic TypeORMError', () => {
		const error = new TypeORMError('connection lost');

		filter.catch(error, host);

		expect(logger.error).toHaveBeenCalledWith({
			err: { message: 'connection lost', stack: error.stack },
			errorType: 'TypeORMError',
			query: undefined,
			msg: 'Database error',
		});
	});

	it('logs the failing query of a QueryFailedError', () => {
		const error = new QueryFailedError('SELECT 1 FROM tickets', [], new Error('boom'));

		filter.catch(error, host);

		expect(logger.error).toHaveBeenCalledTimes(1);
		expect(logger.error.mock.calls[0][0]).toMatchObject({
			errorType: 'QueryFailedError',
			query: 'SELECT 1 FROM tickets',
			msg: 'Database error',
		});
	});
});
