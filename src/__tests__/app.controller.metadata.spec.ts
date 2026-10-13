import { describe, expect, it } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { IS_PUBLIC_KEY } from '../common/guards/public.decorator';
import { prototypeMethod } from '../../test/helpers/prototype-method';

describe('AppController.getHello', () => {
	it('is public so health checks need no token', () => {
		expect(
			new Reflector().get(IS_PUBLIC_KEY, prototypeMethod(AppController.prototype, 'getHello')),
		).toBe(true);
	});

	it('delegates to AppService', () => {
		const service: AppService = { getHello: () => 'delegated' };

		expect(new AppController(service).getHello()).toBe('delegated');
	});
});
