import { describe, expect, it } from '@jest/globals';
import { AppService } from '../app.service';

describe('AppService.getHello', () => {
	it('returns "Hello World!"', () => {
		expect(new AppService().getHello()).toEqual({
			ok: true,
			msg: 'Service is running',
			data: 'Hello World!',
		});
	});
});
