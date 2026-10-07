import { describe, expect, it } from '@jest/globals';
import { EnvironmentVariables, validate } from '../env.validation';

const validEnv = (): Record<string, unknown> => ({
  PORT: '3000',
  LOG_LEVEL: 'info',
  POSTGRES_USER: 'user',
  POSTGRES_PASSWORD: 'secret',
  DATABASE_HOST: 'localhost',
  DATABASE_PORT: '5432',
  DATABASE_NAME: 'ticket_hub',
  INFRA_HUB_API_URL: 'http://infra-hub-api:3001',
  IAM_API_URL: 'http://iam-api:3002',
  TICKET_HUB_API_APPLICATION_NAME: 'ticket-hub',
  IAM_API_APPLICATION_NAME: 'iam',
  INFRA_HUB_API_APPLICATION_NAME: 'infra-hub',
  TICKET_HUB_API_SERVICE_CLIENT_ID: 'client-id',
  TICKET_HUB_API_SERVICE_CLIENT_SECRET: 'client-secret',
});

const without = (key: string): Record<string, unknown> => {
  const env = validEnv();
  delete env[key];
  return env;
};

describe('validate (environment variables)', () => {
  it('returns an EnvironmentVariables instance for a valid environment', () => {
    const result = validate(validEnv());

    expect(result).toBeInstanceOf(EnvironmentVariables);
    expect(result.PORT).toBe('3000');
    expect(result.DATABASE_NAME).toBe('ticket_hub');
  });

  it('accepts "trace" as LOG_LEVEL', () => {
    expect(() => validate({ ...validEnv(), LOG_LEVEL: 'trace' })).not.toThrow();
  });

  it('accepts "fatal" as LOG_LEVEL', () => {
    expect(() => validate({ ...validEnv(), LOG_LEVEL: 'fatal' })).not.toThrow();
  });

  it('ignores variables it does not know about', () => {
    expect(() =>
      validate({ ...validEnv(), SOMETHING_ELSE: 'x' }),
    ).not.toThrow();
  });

  it('throws when PORT is missing', () => {
    expect(() => validate(without('PORT'))).toThrow(
      'Missing required environment variable(s): PORT',
    );
  });

  it('throws when PORT is not numeric', () => {
    expect(() => validate({ ...validEnv(), PORT: 'abc' })).toThrow('PORT');
  });

  it('throws when PORT is a real number instead of a numeric string', () => {
    expect(() => validate({ ...validEnv(), PORT: 3000 })).toThrow('PORT');
  });

  it('throws when LOG_LEVEL is missing', () => {
    expect(() => validate(without('LOG_LEVEL'))).toThrow('LOG_LEVEL');
  });

  it('throws when LOG_LEVEL is not a pino level', () => {
    expect(() => validate({ ...validEnv(), LOG_LEVEL: 'verbose' })).toThrow(
      'LOG_LEVEL',
    );
  });

  it('throws when LOG_LEVEL has a different case', () => {
    expect(() => validate({ ...validEnv(), LOG_LEVEL: 'INFO' })).toThrow(
      'LOG_LEVEL',
    );
  });

  it('throws when DATABASE_PORT is missing', () => {
    expect(() => validate(without('DATABASE_PORT'))).toThrow('DATABASE_PORT');
  });

  it('throws when DATABASE_PORT is not numeric', () => {
    expect(() => validate({ ...validEnv(), DATABASE_PORT: '54x2' })).toThrow(
      'DATABASE_PORT',
    );
  });

  it('throws when POSTGRES_USER is missing', () => {
    expect(() => validate(without('POSTGRES_USER'))).toThrow(
      'Missing required environment variable(s): POSTGRES_USER',
    );
  });

  it('throws when POSTGRES_USER is empty', () => {
    expect(() => validate({ ...validEnv(), POSTGRES_USER: '' })).toThrow(
      'POSTGRES_USER',
    );
  });

  it('throws when POSTGRES_PASSWORD is missing', () => {
    expect(() => validate(without('POSTGRES_PASSWORD'))).toThrow(
      'Missing required environment variable(s): POSTGRES_PASSWORD',
    );
  });

  it('throws when POSTGRES_PASSWORD is empty', () => {
    expect(() => validate({ ...validEnv(), POSTGRES_PASSWORD: '' })).toThrow(
      'POSTGRES_PASSWORD',
    );
  });

  it('throws when DATABASE_HOST is missing', () => {
    expect(() => validate(without('DATABASE_HOST'))).toThrow(
      'Missing required environment variable(s): DATABASE_HOST',
    );
  });

  it('throws when DATABASE_HOST is empty', () => {
    expect(() => validate({ ...validEnv(), DATABASE_HOST: '' })).toThrow(
      'DATABASE_HOST',
    );
  });

  it('throws when DATABASE_NAME is missing', () => {
    expect(() => validate(without('DATABASE_NAME'))).toThrow(
      'Missing required environment variable(s): DATABASE_NAME',
    );
  });

  it('throws when DATABASE_NAME is empty', () => {
    expect(() => validate({ ...validEnv(), DATABASE_NAME: '' })).toThrow(
      'DATABASE_NAME',
    );
  });

  it('throws when INFRA_HUB_API_URL is missing', () => {
    expect(() => validate(without('INFRA_HUB_API_URL'))).toThrow(
      'Missing required environment variable(s): INFRA_HUB_API_URL',
    );
  });

  it('throws when INFRA_HUB_API_URL is empty', () => {
    expect(() => validate({ ...validEnv(), INFRA_HUB_API_URL: '' })).toThrow(
      'INFRA_HUB_API_URL',
    );
  });

  it('throws when IAM_API_URL is missing', () => {
    expect(() => validate(without('IAM_API_URL'))).toThrow(
      'Missing required environment variable(s): IAM_API_URL',
    );
  });

  it('throws when IAM_API_URL is empty', () => {
    expect(() => validate({ ...validEnv(), IAM_API_URL: '' })).toThrow(
      'IAM_API_URL',
    );
  });

  it('throws when TICKET_HUB_API_APPLICATION_NAME is missing', () => {
    expect(() => validate(without('TICKET_HUB_API_APPLICATION_NAME'))).toThrow(
      'Missing required environment variable(s): TICKET_HUB_API_APPLICATION_NAME',
    );
  });

  it('throws when TICKET_HUB_API_APPLICATION_NAME is empty', () => {
    expect(() =>
      validate({ ...validEnv(), TICKET_HUB_API_APPLICATION_NAME: '' }),
    ).toThrow('TICKET_HUB_API_APPLICATION_NAME');
  });

  it('throws when IAM_API_APPLICATION_NAME is missing', () => {
    expect(() => validate(without('IAM_API_APPLICATION_NAME'))).toThrow(
      'Missing required environment variable(s): IAM_API_APPLICATION_NAME',
    );
  });

  it('throws when IAM_API_APPLICATION_NAME is empty', () => {
    expect(() =>
      validate({ ...validEnv(), IAM_API_APPLICATION_NAME: '' }),
    ).toThrow('IAM_API_APPLICATION_NAME');
  });

  it('throws when INFRA_HUB_API_APPLICATION_NAME is missing', () => {
    expect(() => validate(without('INFRA_HUB_API_APPLICATION_NAME'))).toThrow(
      'Missing required environment variable(s): INFRA_HUB_API_APPLICATION_NAME',
    );
  });

  it('throws when INFRA_HUB_API_APPLICATION_NAME is empty', () => {
    expect(() =>
      validate({ ...validEnv(), INFRA_HUB_API_APPLICATION_NAME: '' }),
    ).toThrow('INFRA_HUB_API_APPLICATION_NAME');
  });

  it('throws when TICKET_HUB_API_SERVICE_CLIENT_ID is missing', () => {
    expect(() => validate(without('TICKET_HUB_API_SERVICE_CLIENT_ID'))).toThrow(
      'Missing required environment variable(s): TICKET_HUB_API_SERVICE_CLIENT_ID',
    );
  });

  it('throws when TICKET_HUB_API_SERVICE_CLIENT_ID is empty', () => {
    expect(() =>
      validate({ ...validEnv(), TICKET_HUB_API_SERVICE_CLIENT_ID: '' }),
    ).toThrow('TICKET_HUB_API_SERVICE_CLIENT_ID');
  });

  it('throws when TICKET_HUB_API_SERVICE_CLIENT_SECRET is missing', () => {
    expect(() =>
      validate(without('TICKET_HUB_API_SERVICE_CLIENT_SECRET')),
    ).toThrow(
      'Missing required environment variable(s): TICKET_HUB_API_SERVICE_CLIENT_SECRET',
    );
  });

  it('throws when TICKET_HUB_API_SERVICE_CLIENT_SECRET is empty', () => {
    expect(() =>
      validate({ ...validEnv(), TICKET_HUB_API_SERVICE_CLIENT_SECRET: '' }),
    ).toThrow('TICKET_HUB_API_SERVICE_CLIENT_SECRET');
  });

  it('lists every invalid variable in a single error message', () => {
    const env: Record<string, unknown> = {
      ...validEnv(),
      PORT: 'abc',
      IAM_API_URL: '',
    };
    delete env.POSTGRES_USER;

    expect(() => validate(env)).toThrow(
      'Missing required environment variable(s): PORT, POSTGRES_USER, IAM_API_URL',
    );
  });

  it('throws for an empty configuration', () => {
    expect(() => validate({})).toThrow(
      'Missing required environment variable(s)',
    );
  });
});
