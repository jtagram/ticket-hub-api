import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FindDatabaseDeploymentsDto } from '../../dto/find-database-deployments.dto';

// Mirrors the global ValidationPipe configured in main.ts.
const PIPE_OPTIONS = { whitelist: true, forbidNonWhitelisted: true };

function validateDto(payload: Record<string, unknown>) {
  return validate(
    plainToInstance(FindDatabaseDeploymentsDto, payload),
    PIPE_OPTIONS,
  );
}

describe('FindDatabaseDeploymentsDto', () => {
  it('accepts a valid namespace', async () => {
    expect(await validateDto({ namespace: 'prod' })).toHaveLength(0);
  });

  it('accepts a namespace of exactly 63 characters', async () => {
    expect(await validateDto({ namespace: 'a'.repeat(63) })).toHaveLength(0);
  });

  it('rejects a missing namespace', async () => {
    const errors = await validateDto({});

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('namespace');
    expect(errors[0].constraints).toHaveProperty('isString');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('rejects an empty namespace', async () => {
    const errors = await validateDto({ namespace: '' });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      isNotEmpty: 'namespace should not be empty',
    });
  });

  it('rejects a namespace longer than 63 characters', async () => {
    const errors = await validateDto({ namespace: 'a'.repeat(64) });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      maxLength: 'namespace must be shorter than or equal to 63 characters',
    });
  });

  it('rejects a namespace that is not a string', async () => {
    const errors = await validateDto({ namespace: 123 });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('rejects an unknown property', async () => {
    const errors = await validateDto({ namespace: 'prod', extra: 'value' });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('extra');
    expect(errors[0].constraints).toEqual({
      whitelistValidation: 'property extra should not exist',
    });
  });
});
