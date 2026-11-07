import { describe, expect, it } from '@jest/globals';
import { ValueListMapper } from '../../mapper/value-list.mapper';

describe('ValueListMapper', () => {
	it('wraps internal users as value-label pairs in a success envelope', () => {
		expect(
			ValueListMapper.toAssigneesResponse([
				{ id: 1, name: 'Ada', lastname: 'Lovelace', email: 'ada@example.com' },
			]),
		).toEqual({
			ok: true,
			msg: 'Assignees retrieved successfully',
			data: [{ value: 'ada@example.com', label: 'Ada Lovelace (ada@example.com)' }],
		});
	});

	it('wraps deployments with the same text as value and label', () => {
		expect(ValueListMapper.toDatabaseDeploymentsResponse(['pg'])).toEqual({
			ok: true,
			msg: 'Database deployments retrieved successfully',
			data: [{ value: 'pg', label: 'pg' }],
		});
	});

	it('wraps database names with the same text as value and label', () => {
		expect(ValueListMapper.toDatabaseNamesResponse([])).toEqual({
			ok: true,
			msg: 'Database names retrieved successfully',
			data: [],
		});
	});
});
