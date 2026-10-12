import { INestApplication } from '@nestjs/common';
import request from 'supertest';

/** `getHttpServer()` is typed `any`; supertest expects its own server type. */
export function httpServerOf(app: INestApplication) {
  return app.getHttpServer() as Parameters<typeof request>[0];
}
