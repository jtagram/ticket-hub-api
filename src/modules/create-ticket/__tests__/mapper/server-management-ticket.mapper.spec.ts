import { describe, expect, it } from '@jest/globals';
import { ServerManagementTicketEntity } from '../../../../common/database/server-management-ticket/server-management-ticket.entity';
import { TicketStatus } from '../../../../common/database/ticket-status.enum';
import { CreateServerManagementTicketDto } from '../../dto/create-server-management-ticket.dto';
import { ServerManagementTicketMapper } from '../../mapper/server-management-ticket.mapper';

function buildDto(
  overrides: Partial<CreateServerManagementTicketDto> = {},
): CreateServerManagementTicketDto {
  return Object.assign(new CreateServerManagementTicketDto(), {
    informer: 'informer@example.com',
    assignee: 'assignee@example.com',
    department: 'INFRA',
    subject: 'Restart server',
    description: 'Server needs a restart',
    codeAnsible: '- hosts: all',
    ...overrides,
  });
}

describe('ServerManagementTicketMapper', () => {
  describe('toEntity', () => {
    it('maps every dto field to the entity', () => {
      const dto = buildDto();

      const entity = ServerManagementTicketMapper.toEntity(dto);

      expect(entity).toBeInstanceOf(ServerManagementTicketEntity);
      expect(entity.informer).toBe(dto.informer);
      expect(entity.assignee).toBe(dto.assignee);
      expect(entity.department).toBe(dto.department);
      expect(entity.subject).toBe(dto.subject);
      expect(entity.description).toBe(dto.description);
      expect(entity.codeAnsible).toBe(dto.codeAnsible);
    });

    it('sets the status to OPEN and an empty response', () => {
      const entity = ServerManagementTicketMapper.toEntity(buildDto());

      expect(entity.status).toBe(TicketStatus.OPEN);
      expect(entity.response).toBe('');
    });

    it('throws the builder error when the informer is not set yet', () => {
      const dto = buildDto({ informer: undefined });

      expect(() => ServerManagementTicketMapper.toEntity(dto)).toThrow(
        'Cannot build ServerManagementTicketEntity: missing required field "informer"',
      );
    });

    it.each([
      'informer',
      'assignee',
      'department',
      'subject',
      'description',
      'codeAnsible',
    ] as const)(
      'throws the builder error for a whitespace-only %s',
      (field) => {
        const dto = buildDto({ [field]: '   ' });

        expect(() => ServerManagementTicketMapper.toEntity(dto)).toThrow(
          `Cannot build ServerManagementTicketEntity: missing required field "${field}"`,
        );
      },
    );
  });

  describe('toManageServerCommandRequest', () => {
    it('builds the request mapping codeAnsible to playbook', () => {
      const ticket = ServerManagementTicketMapper.toEntity(buildDto());
      ticket.number = 3;

      expect(
        ServerManagementTicketMapper.toManageServerCommandRequest(ticket),
      ).toEqual({
        numberOfTickets: 3,
        playbook: '- hosts: all',
      });
    });
  });
});
