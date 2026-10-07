import { describe, expect, it } from '@jest/globals';
import { KubectlCommandTicketEntity } from '../../../../common/database/kubectl-command-ticket/kubectl-command-ticket.entity';
import { TicketStatus } from '../../../../common/database/ticket-status.enum';
import { CreateKubectlCommandTicketDto } from '../../dto/create-kubectl-command-ticket.dto';
import { KubectlCommandTicketMapper } from '../../mapper/kubectl-command-ticket.mapper';

function buildDto(
  overrides: Partial<CreateKubectlCommandTicketDto> = {},
): CreateKubectlCommandTicketDto {
  return Object.assign(new CreateKubectlCommandTicketDto(), {
    informer: 'informer@example.com',
    assignee: 'assignee@example.com',
    department: 'PLATFORM',
    subject: 'List pods',
    description: 'List the pods of the default namespace',
    kubectlCommand: 'kubectl get pods',
    ...overrides,
  });
}

describe('KubectlCommandTicketMapper', () => {
  describe('toEntity', () => {
    it('maps every dto field to the entity', () => {
      const dto = buildDto();

      const entity = KubectlCommandTicketMapper.toEntity(dto);

      expect(entity).toBeInstanceOf(KubectlCommandTicketEntity);
      expect(entity.informer).toBe(dto.informer);
      expect(entity.assignee).toBe(dto.assignee);
      expect(entity.department).toBe(dto.department);
      expect(entity.subject).toBe(dto.subject);
      expect(entity.description).toBe(dto.description);
      expect(entity.kubectlCommand).toBe(dto.kubectlCommand);
    });

    it('sets the status to OPEN and an empty response', () => {
      const entity = KubectlCommandTicketMapper.toEntity(buildDto());

      expect(entity.status).toBe(TicketStatus.OPEN);
      expect(entity.response).toBe('');
    });

    it('throws the builder error when the informer is not set yet', () => {
      const dto = buildDto({ informer: undefined });

      expect(() => KubectlCommandTicketMapper.toEntity(dto)).toThrow(
        'Cannot build KubectlCommandTicketEntity: missing required field "informer"',
      );
    });

    it.each([
      'informer',
      'assignee',
      'department',
      'subject',
      'description',
      'kubectlCommand',
    ] as const)(
      'throws the builder error for a whitespace-only %s',
      (field) => {
        const dto = buildDto({ [field]: '   ' });

        expect(() => KubectlCommandTicketMapper.toEntity(dto)).toThrow(
          `Cannot build KubectlCommandTicketEntity: missing required field "${field}"`,
        );
      },
    );
  });

  describe('toExecuteKubectlCommandRequest', () => {
    it('builds the request from the ticket', () => {
      const ticket = KubectlCommandTicketMapper.toEntity(buildDto());
      ticket.number = 11;

      expect(
        KubectlCommandTicketMapper.toExecuteKubectlCommandRequest(ticket),
      ).toEqual({
        numberOfTickets: 11,
        kubectlCommand: 'kubectl get pods',
      });
    });
  });
});
