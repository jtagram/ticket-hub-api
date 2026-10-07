import { describe, expect, it } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { AppController } from '../app.controller';
import { AppService } from '../app.service';
import { IS_PUBLIC_KEY } from '../common/guards/public.decorator';

describe('AppController.getHello', () => {
  it('is public so health checks need no token', () => {
    expect(
      new Reflector().get(IS_PUBLIC_KEY, AppController.prototype.getHello),
    ).toBe(true);
  });

  it('delegates to AppService', () => {
    const service = { getHello: () => 'delegated' } as unknown as AppService;

    expect(new AppController(service).getHello()).toBe('delegated');
  });
});
