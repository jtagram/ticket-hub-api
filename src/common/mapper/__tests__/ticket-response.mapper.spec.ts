import { describe, expect, it } from '@jest/globals';
import { TicketResponseMapper } from '../ticket-response.mapper';

const ticket = { number: 7 };

describe('TicketResponseMapper', () => {
	it.each([
		['toCreated', 'Server management ticket created', ticket],
		['toFound', 'Server management ticket retrieved', ticket],
		['toApproved', 'Server management ticket approved', ticket],
		['toRejected', 'Server management ticket rejected', ticket],
	] as const)('%s wraps one ticket in a success envelope', (method, msg, data) => {
		expect(TicketResponseMapper[method]('Server management', data)).toEqual({
			ok: true,
			msg,
			data,
		});
	});

	it('toList wraps the tickets array in a success envelope', () => {
		expect(TicketResponseMapper.toList('Server management', [ticket])).toEqual({
			ok: true,
			msg: 'Server management tickets retrieved',
			data: [ticket],
		});
	});

	it('toList keeps an empty array as data', () => {
		expect(TicketResponseMapper.toList('Kubectl command', [])).toEqual({
			ok: true,
			msg: 'Kubectl command tickets retrieved',
			data: [],
		});
	});
});
