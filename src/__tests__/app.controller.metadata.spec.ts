import { describe, expect, it } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { ResponseBody } from '../common/dto/response-body.dto';
import { IS_PUBLIC_KEY } from '../common/guards/public.decorator';
import { prototypeMethod } from '../../test/helpers/prototype-method';

describe('AppController.getHello', () => {
	it('is public so health checks need no token', () => {
		expect(
			new Reflector().get(IS_PUBLIC_KEY, prototypeMethod(AppController.prototype, 'getHello')),
		).toBe(true);
	});

	it('delegates to AppService', () => {
		const envelope = ResponseBody.success('msg', 'delegated');
		const service: AppService = { getHello: () => envelope };

		expect(new AppController(service).getHello()).toBe(envelope);
	});
});
