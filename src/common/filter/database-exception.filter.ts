import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Logger } from 'nestjs-pino';
import { QueryFailedError, TypeORMError } from 'typeorm';
import { ResponseBody } from '../dto/response-body.dto';
import { GENERIC_ERROR_MESSAGE } from './generic-error-message';

const POSTGRES_UNIQUE_VIOLATION_CODE = '23505';
const UNIQUE_VIOLATION_MESSAGE = 'The resource conflicts with an existing one';

@Catch(TypeORMError)
export class DatabaseExceptionFilter implements ExceptionFilter {
	constructor(private readonly logger: Logger) {}

	catch(exception: TypeORMError, host: ArgumentsHost): void {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const isUniqueViolation = isPostgresUniqueViolation(exception);

		this.logger[isUniqueViolation ? 'warn' : 'error']({
			err: {
				message: exception.message,
				stack: exception.stack,
			},
			errorType: exception.constructor.name,
			query: (exception as { query?: string }).query,
			msg: 'Database error',
		});

		if (isUniqueViolation) {
			response.status(HttpStatus.CONFLICT).json(ResponseBody.failure(UNIQUE_VIOLATION_MESSAGE));
			return;
		}

		response
			.status(HttpStatus.INTERNAL_SERVER_ERROR)
			.json(ResponseBody.failure(GENERIC_ERROR_MESSAGE));
	}
}

function isPostgresUniqueViolation(exception: TypeORMError): boolean {
	return (
		exception instanceof QueryFailedError &&
		(exception.driverError as { code?: string } | undefined)?.code ===
			POSTGRES_UNIQUE_VIOLATION_CODE
	);
}
