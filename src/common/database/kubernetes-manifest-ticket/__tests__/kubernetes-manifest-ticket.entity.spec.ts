import { describe, expect, it } from '@jest/globals';
import { TicketStatus } from '../../ticket-status.enum';
import { KubernetesTicketAction } from '../../kubernetes-ticket/kubernetes-ticket-action.enum';
import { KubernetesManifestTicketEntity } from '../kubernetes-manifest-ticket.entity';

const validValues = {
  informer: 'informer@example.com',
  assignee: 'assignee@example.com',
  department: 'PLATFORM',
  subject: 'Deploy service',
  status: TicketStatus.OPEN,
  description: 'Deploy the service manifest',
  namespace: 'default',
  action: KubernetesTicketAction.APPLY,
  codeYaml: 'apiVersion: v1\nkind: Pod',
  response: '',
};

type Field = keyof typeof validValues;

// Values are `unknown` on purpose: the tests feed null/undefined/'' to the builder.
function build(overrides: Partial<Record<Field, unknown>> = {}) {
  const values = { ...validValues, ...overrides } as typeof validValues;
  return KubernetesManifestTicketEntity.builder()
    .withInformer(values.informer)
    .withAssignee(values.assignee)
    .withDepartment(values.department)
    .withSubject(values.subject)
    .withStatus(values.status)
    .withDescription(values.description)
    .withNamespace(values.namespace)
    .withAction(values.action)
    .withCodeYaml(values.codeYaml)
    .withResponse(values.response)
    .build();
}

const NON_EMPTY_TEXT_FIELDS: Field[] = [
  'informer',
  'assignee',
  'department',
  'subject',
  'description',
  'namespace',
  'codeYaml',
];
const ALL_FIELDS = Object.keys(validValues) as Field[];

const missingFieldMessage = (field: string) =>
  `Cannot build KubernetesManifestTicketEntity: missing required field "${field}"`;

describe('KubernetesManifestTicketEntity builder', () => {
  it('builds an entity when every field is valid', () => {
    const entity = build();

    expect(entity).toBeInstanceOf(KubernetesManifestTicketEntity);
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
