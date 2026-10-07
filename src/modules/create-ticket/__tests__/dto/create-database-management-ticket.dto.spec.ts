import { describe, expect, it } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDatabaseManagementTicketDto } from '../../dto/create-database-management-ticket.dto';

// Mirrors the global ValidationPipe configured in main.ts.
const PIPE_OPTIONS = { whitelist: true, forbidNonWhitelisted: true };

function validPayload(): Record<string, unknown> {
  return {
    informer: 'informer@example.com',
    assignee: 'assignee@example.com',
    department: 'DATA',
    subject: 'Add index',
    description: 'Add an index',
    dbNamespace: 'databases',
    dbDeployment: 'postgres',
    dbName: 'orders',
    sqlCode: 'SELECT 1;',
  };
}

function validateDto(payload: Record<string, unknown>) {
  return validate(
    plainToInstance(CreateDatabaseManagementTicketDto, payload),
    PIPE_OPTIONS,
  );
}

async function failingProperties(payload: Record<string, unknown>) {
  const errors = await validateDto(payload);
  return errors.map((error) => error.property);
}

describe('CreateDatabaseManagementTicketDto', () => {
  it('accepts a fully valid payload', async () => {
    expect(await validateDto(validPayload())).toHaveLength(0);
  });

  describe('required fields', () => {
    it.each([
      'assignee',
      'department',
      'subject',
      'description',
      'dbNamespace',
      'dbDeployment',
      'dbName',
      'sqlCode',
    ])('rejects a missing %s', async (field) => {
      const payload = validPayload();
      delete payload[field];

      expect(await failingProperties(payload)).toEqual([field]);
    });

    it.each([
      'informer',
      'assignee',
      'department',
      'subject',
      'description',
      'dbNamespace',
      'dbDeployment',
      'dbName',
      'sqlCode',
    ])('rejects an empty %s', async (field) => {
      expect(
        await failingProperties({ ...validPayload(), [field]: '' }),
      ).toEqual([field]);
    });

    it.each([
      'informer',
      'assignee',
      'department',
      'subject',
      'description',
      'dbNamespace',
      'dbDeployment',
      'dbName',
      'sqlCode',
    ])('rejects a non-string %s', async (field) => {
      expect(
        await failingProperties({ ...validPayload(), [field]: 123 }),
      ).toEqual([field]);
    });
  });

  describe('informer', () => {
    it('accepts a payload without informer because the controller sets it', async () => {
      const payload = validPayload();
      delete payload.informer;

      expect(await validateDto(payload)).toHaveLength(0);
    });

    it('accepts a valid informer email when present', async () => {
      expect(
        await validateDto({
          ...validPayload(),
          informer: 'someone@example.com',
        }),
      ).toHaveLength(0);
    });

    it.each(['not-an-email', 'missing-at.example.com', '@example.com', 'a@'])(
      'rejects the invalid email %p',
      async (informer) => {
        expect(
          await failingProperties({ ...validPayload(), informer }),
        ).toEqual(['informer']);
      },
    );
  });

  describe('max length', () => {
    it.each([
      ['assignee', 50],
      ['department', 50],
      ['subject', 500],
      ['description', 500],
      ['dbNamespace', 50],
      ['dbDeployment', 50],
      ['dbName', 50],
    ])(
      '%s accepts exactly %i characters and rejects one more',
      async (field, max) => {
        const exact = 'x'.repeat(max);
        const tooLong = 'x'.repeat(max + 1);

        expect(
          await validateDto({ ...validPayload(), [field]: exact }),
        ).toHaveLength(0);
        expect(
          await failingProperties({ ...validPayload(), [field]: tooLong }),
        ).toEqual([field]);
      },
    );

    it('accepts an informer email of exactly 50 characters and rejects 51', async () => {
      const exact = `${'a'.repeat(38)}@example.com`;
      const tooLong = `${'a'.repeat(39)}@example.com`;

      expect(exact).toHaveLength(50);
      expect(
        await validateDto({ ...validPayload(), informer: exact }),
      ).toHaveLength(0);
      expect(
        await failingProperties({ ...validPayload(), informer: tooLong }),
      ).toEqual(['informer']);
    });
  });

  it('rejects an unknown extra property', async () => {
    const errors = await validateDto({ ...validPayload(), extra: 'value' });

    expect(errors.map((error) => error.property)).toEqual(['extra']);
    expect(errors[0].constraints).toHaveProperty('whitelistValidation');
  });

  describe('whitespace-only values', () => {
    it.each([
      'assignee',
      'department',
      'subject',
      'description',
      'dbNamespace',
      'dbDeployment',
      'dbName',
      'sqlCode',
    ])('rejects a whitespace-only %s', async (field) => {
      expect(
        await failingProperties({ ...validPayload(), [field]: '   ' }),
      ).toEqual([field]);
    });

    it.each([
      'assignee',
      'department',
      'subject',
      'description',
      'dbNamespace',
      'dbDeployment',
      'dbName',
      'sqlCode',
    ])('rejects a %s made only of tabs and line breaks', async (field) => {
      expect(
        await failingProperties({ ...validPayload(), [field]: ' \t\r\n ' }),
      ).toEqual([field]);
    });

    it('reports the blank message for a whitespace-only subject', async () => {
      const errors = await validateDto({ ...validPayload(), subject: '   ' });

      expect(errors[0].constraints).toEqual({
        matches: 'subject must not be blank',
      });
    });

    it('still accepts content surrounded by whitespace', async () => {
      expect(
        await validateDto({ ...validPayload(), subject: '  Add index  ' }),
      ).toHaveLength(0);
    });
  });
});
