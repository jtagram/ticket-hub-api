import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DatabaseExceptionFilter } from './database-exception.filter';
import { HttpExceptionFilter } from './http-exception.filter';
import { UnknownExceptionFilter } from './unknown-exception.filter';

@Global()
@Module({
  providers: [
    { provide: APP_FILTER, useClass: DatabaseExceptionFilter },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: UnknownExceptionFilter },
  ],
})
export class FilterModule {}
