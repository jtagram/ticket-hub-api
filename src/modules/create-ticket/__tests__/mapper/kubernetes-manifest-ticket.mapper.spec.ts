import { describe, expect, it } from '@jest/globals';
import { KubernetesManifestTicketEntity } from '../../../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { KubernetesTicketAction } from '../../../../common/database/kubernetes-ticket/kubernetes-ticket-action.enum';
import { TicketStatus } from '../../../../common/database/ticket-status.enum';
import { CreateKubernetesManifestTicketDto } from '../../dto/create-kubernetes-manifest-ticket.dto';
import { KubernetesManifestTicketMapper } from '../../mapper/kubernetes-manifest-ticket.mapper';

function buildDto(
  overrides: Partial<CreateKubernetesManifestTicketDto> = {},
): CreateKubernetesManifestTicketDto {
  return Object.assign(new CreateKubernetesManifestTicketDto(), {
    informer: 'informer@example.com',
    assignee: 'assignee@example.com',
    department: 'PLATFORM',
    subject: 'Deploy app',
    description: 'Deploy the app manifest',
    namespace: 'apps',
    action: KubernetesTicketAction.APPLY,
    codeYaml: 'kind: Deployment',
    ...overrides,
  });
}

describe('KubernetesManifestTicketMapper', () => {
  describe('toEntity', () => {
    it('maps every dto field to the entity', () => {
      const dto = buildDto();

      const entity = KubernetesManifestTicketMapper.toEntity(dto);

      expect(entity).toBeInstanceOf(KubernetesManifestTicketEntity);
      expect(entity.informer).toBe(dto.informer);
      expect(entity.assignee).toBe(dto.assignee);
      expect(entity.department).toBe(dto.department);
      expect(entity.subject).toBe(dto.subject);
      expect(entity.description).toBe(dto.description);
      expect(entity.namespace).toBe(dto.namespace);
      expect(entity.action).toBe(dto.action);
      expect(entity.codeYaml).toBe(dto.codeYaml);
    });

    it('sets the status to OPEN and an empty response', () => {
      const entity = KubernetesManifestTicketMapper.toEntity(buildDto());

      expect(entity.status).toBe(TicketStatus.OPEN);
      expect(entity.response).toBe('');
    });

    it('throws the builder error when the informer is not set yet', () => {
      const dto = buildDto({ informer: undefined });

      expect(() => KubernetesManifestTicketMapper.toEntity(dto)).toThrow(
        'Cannot build KubernetesManifestTicketEntity: missing required field "informer"',
      );
    });

    it.each([
      'informer',
      'assignee',
      'department',
      'subject',
      'description',
      'namespace',
      'codeYaml',
    ] as const)(
      'throws the builder error for a whitespace-only %s',
      (field) => {
        const dto = buildDto({ [field]: '   ' });

        expect(() => KubernetesManifestTicketMapper.toEntity(dto)).toThrow(
          `Cannot build KubernetesManifestTicketEntity: missing required field "${field}"`,
        );
      },
    );
  });

  describe('toManageKubernetesManifestRequest', () => {
    it.each([
      [KubernetesTicketAction.APPLY, 'apply'],
      [KubernetesTicketAction.DELETE, 'delete'],
      [KubernetesTicketAction.CREATE, 'create'],
    ])('builds the request for the %s action', (action, expected) => {
      const ticket = KubernetesManifestTicketMapper.toEntity(
        buildDto({ action }),
      );
      ticket.number = 5;

      expect(
        KubernetesManifestTicketMapper.toManageKubernetesManifestRequest(
          ticket,
        ),
      ).toEqual({
        numberOfTickets: 5,
        namespace: 'apps',
        action: expected,
        manifest: 'kind: Deployment',
      });
    });
  });
});
