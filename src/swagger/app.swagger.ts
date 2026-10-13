import { applyDecorators } from '@nestjs/common';
import { ApiOkResponse, ApiOperation } from '@nestjs/swagger';

export const ApiGetHello = () =>
	applyDecorators(
		ApiOperation({
			summary: 'Health greeting',
			description: 'Public endpoint that returns a plain-text greeting.',
		}),
		ApiOkResponse({
			description: 'Greeting returned.',
			schema: { type: 'string', example: 'Hello World!' },
		}),
	);
