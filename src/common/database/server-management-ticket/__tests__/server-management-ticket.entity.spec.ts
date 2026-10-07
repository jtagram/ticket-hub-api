import { describe, expect, it } from '@jest/globals';
import { TicketStatus } from '../../ticket-status.enum';
import { ServerManagementTicketEntity } from '../server-management-ticket.entity';

const validValues = {
  informer: 'informer@example.com',
  assignee: 'assignee@example.com',
  department: 'INFRA',
  subject: 'Restart server',
  status: TicketStatus.OPEN,
  description: 'Server needs a restart',
  codeAnsible: '- hosts: all',
  response: '',
};

type Field = keyof typeof validValues;

// Values are `unknown` on purpose: the tests feed null/undefined/'' to the builder.
function build(overrides: Partial<Record<Field, unknown>> = {}) {
  const values = { ...validValues, ...overrides } as typeof validValues;
  return ServerManagementTicketEntity.builder()
    .withInformer(values.informer)
    .withAssignee(values.assignee)
    .withDepartment(values.department)
    .withSubject(values.subject)
    .withStatus(values.status)
    .withDescription(values.description)
    .withCodeAnsible(values.codeAnsible)
    .withResponse(values.response)
    .build();
}

const NON_EMPTY_TEXT_FIELDS: Field[] = [
  'informer',
  'assignee',
  'department',
  'subject',
  'description',
  'codeAnsible',
];
const ALL_FIELDS = Object.keys(validValues) as Field[];

const missingFieldMessage = (field: string) =>
  `Cannot build ServerManagementTicketEntity: missing required field "${field}"`;

describe('ServerManagementTicketEntity builder', () => {
  it('builds an entity when every field is valid', () => {
    const entity = build();

    expect(entity).toBeInstanceOf(ServerManagementTicketEntity);
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
