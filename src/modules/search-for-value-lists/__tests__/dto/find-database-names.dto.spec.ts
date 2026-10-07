import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FindDatabaseNamesDto } from '../../dto/find-database-names.dto';

// Mirrors the global ValidationPipe configured in main.ts.
const PIPE_OPTIONS = { whitelist: true, forbidNonWhitelisted: true };

function validateDto(payload: Record<string, unknown>) {
  return validate(plainToInstance(FindDatabaseNamesDto, payload), PIPE_OPTIONS);
}

describe('FindDatabaseNamesDto', () => {
  it('accepts a valid namespace and deployment', async () => {
    expect(
      await validateDto({ namespace: 'prod', deployment: 'postgres-main' }),
    ).toHaveLength(0);
  });

  it('accepts a namespace and a deployment of exactly 63 characters', async () => {
    expect(
      await validateDto({
        namespace: 'a'.repeat(63),
        deployment: 'b'.repeat(63),
      }),
    ).toHaveLength(0);
  });

  it('rejects a missing namespace', async () => {
    const errors = await validateDto({ deployment: 'postgres-main' });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('namespace');
    expect(errors[0].constraints).toHaveProperty('isString');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('rejects a missing deployment', async () => {
    const errors = await validateDto({ namespace: 'prod' });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('deployment');
    expect(errors[0].constraints).toHaveProperty('isString');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });

  it('rejects both properties when the payload is empty', async () => {
    const errors = await validateDto({});

    expect(errors.map((error) => error.property).sort()).toEqual([
      'deployment',
      'namespace',
    ]);
  });

  it('rejects an empty namespace', async () => {
    const errors = await validateDto({
      namespace: '',
      deployment: 'postgres-main',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      isNotEmpty: 'namespace should not be empty',
    });
  });

  it('rejects an empty deployment', async () => {
    const errors = await validateDto({ namespace: 'prod', deployment: '' });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      isNotEmpty: 'deployment should not be empty',
    });
  });

  it('rejects a namespace longer than 63 characters', async () => {
    const errors = await validateDto({
      namespace: 'a'.repeat(64),
      deployment: 'postgres-main',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      maxLength: 'namespace must be shorter than or equal to 63 characters',
    });
  });

  it('rejects a deployment longer than 63 characters', async () => {
    const errors = await validateDto({
      namespace: 'prod',
      deployment: 'b'.repeat(64),
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      maxLength: 'deployment must be shorter than or equal to 63 characters',
    });
  });

  it('rejects a namespace that is not a string', async () => {
    const errors = await validateDto({
      namespace: 123,
      deployment: 'postgres-main',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('rejects a deployment that is not a string', async () => {
    const errors = await validateDto({ namespace: 'prod', deployment: true });

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('isString');
  });

  it('rejects an unknown property', async () => {
    const errors = await validateDto({
      namespace: 'prod',
      deployment: 'postgres-main',
      extra: 'value',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('extra');
    expect(errors[0].constraints).toEqual({
      whitelistValidation: 'property extra should not exist',
    });
  });
});
