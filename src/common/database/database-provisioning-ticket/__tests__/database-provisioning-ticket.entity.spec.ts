import { describe, expect, it } from '@jest/globals';
import { TicketStatus } from '../../ticket-status.enum';
import { DatabaseProvisioningTicketEntity } from '../database-provisioning-ticket.entity';

const validValues = {
  informer: 'informer@example.com',
  assignee: 'assignee@example.com',
  department: 'DATA',
  subject: 'Create database',
  status: TicketStatus.OPEN,
  description: 'A new database is needed',
  dbNamespace: 'databases',
  dbDeployment: 'postgres',
  newDbName: 'billing',
  response: '',
};

type Field = keyof typeof validValues;

// Values are `unknown` on purpose: the tests feed null/undefined/'' to the builder.
function build(overrides: Partial<Record<Field, unknown>> = {}) {
  const values = { ...validValues, ...overrides } as typeof validValues;
  return DatabaseProvisioningTicketEntity.builder()
    .withInformer(values.informer)
    .withAssignee(values.assignee)
    .withDepartment(values.department)
    .withSubject(values.subject)
    .withStatus(values.status)
    .withDescription(values.description)
    .withDbNamespace(values.dbNamespace)
    .withDbDeployment(values.dbDeployment)
    .withNewDbName(values.newDbName)
    .withResponse(values.response)
    .build();
}

const NON_EMPTY_TEXT_FIELDS: Field[] = [
  'informer',
  'assignee',
  'department',
  'subject',
  'description',
  'dbNamespace',
  'dbDeployment',
  'newDbName',
];
const ALL_FIELDS = Object.keys(validValues) as Field[];

const missingFieldMessage = (field: string) =>
  `Cannot build DatabaseProvisioningTicketEntity: missing required field "${field}"`;

describe('DatabaseProvisioningTicketEntity builder', () => {
  it('builds an entity when every field is valid', () => {
    const entity = build();

    expect(entity).toBeInstanceOf(DatabaseProvisioningTicketEntity);
    expect(entity.informer).toBe(validValues.informer);
  });

  it('accepts an empty response, which is how new tickets start', () => {
    expect(build({ response: '' }).response).toBe('');
  });

  it.each(ALL_FIELDS)('rejects an undefined %s', (field) => {
    expect(() => build({ [field]: undefined })).toThrow(
      missingFieldMessage(field),
    );
  });

  it.each(ALL_FIELDS)('rejects a null %s', (field) => {
    expect(() => build({ [field]: null })).toThrow(missingFieldMessage(field));
  });

  it.each(NON_EMPTY_TEXT_FIELDS)('rejects an empty %s', (field) => {
    expect(() => build({ [field]: '' })).toThrow(missingFieldMessage(field));
  });

  it.each(NON_EMPTY_TEXT_FIELDS)('rejects a whitespace-only %s', (field) => {
    expect(() => build({ [field]: '   ' })).toThrow(missingFieldMessage(field));
  });
});
