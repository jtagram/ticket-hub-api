import { describe, expect, it } from '@jest/globals';
import { DatabaseProvisioningTicketEntity } from '../../../../common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { TicketStatus } from '../../../../common/database/ticket-status.enum';
import { CreateDatabaseProvisioningTicketDto } from '../../dto/create-database-provisioning-ticket.dto';
import { DatabaseProvisioningTicketMapper } from '../../mapper/database-provisioning-ticket.mapper';

function buildDto(
  overrides: Partial<CreateDatabaseProvisioningTicketDto> = {},
): CreateDatabaseProvisioningTicketDto {
  return Object.assign(new CreateDatabaseProvisioningTicketDto(), {
    informer: 'informer@example.com',
    assignee: 'assignee@example.com',
    department: 'DATA',
    subject: 'New database',
    description: 'Provision a database for billing',
    dbNamespace: 'databases',
    dbDeployment: 'postgres',
    newDbName: 'billing',
    ...overrides,
  });
}

describe('DatabaseProvisioningTicketMapper', () => {
  describe('toEntity', () => {
    it('maps every dto field to the entity', () => {
      const dto = buildDto();

      const entity = DatabaseProvisioningTicketMapper.toEntity(dto);

      expect(entity).toBeInstanceOf(DatabaseProvisioningTicketEntity);
      expect(entity.informer).toBe(dto.informer);
      expect(entity.assignee).toBe(dto.assignee);
      expect(entity.department).toBe(dto.department);
      expect(entity.subject).toBe(dto.subject);
      expect(entity.description).toBe(dto.description);
      expect(entity.dbNamespace).toBe(dto.dbNamespace);
      expect(entity.dbDeployment).toBe(dto.dbDeployment);
      expect(entity.newDbName).toBe(dto.newDbName);
    });

    it('sets the status to OPEN and an empty response', () => {
      const entity = DatabaseProvisioningTicketMapper.toEntity(buildDto());

      expect(entity.status).toBe(TicketStatus.OPEN);
      expect(entity.response).toBe('');
    });

    it('throws the builder error when the informer is not set yet', () => {
      const dto = buildDto({ informer: undefined });

      expect(() => DatabaseProvisioningTicketMapper.toEntity(dto)).toThrow(
        'Cannot build DatabaseProvisioningTicketEntity: missing required field "informer"',
      );
    });

    it.each([
      'informer',
      'assignee',
      'department',
      'subject',
      'description',
      'dbNamespace',
      'dbDeployment',
      'newDbName',
    ] as const)(
      'throws the builder error for a whitespace-only %s',
      (field) => {
        const dto = buildDto({ [field]: '   ' });

        expect(() => DatabaseProvisioningTicketMapper.toEntity(dto)).toThrow(
          `Cannot build DatabaseProvisioningTicketEntity: missing required field "${field}"`,
        );
      },
    );
  });

  describe('toCreateDatabaseRequest', () => {
    it('builds the request from the ticket', () => {
      const ticket = DatabaseProvisioningTicketMapper.toEntity(buildDto());
      ticket.number = 7;

      expect(
        DatabaseProvisioningTicketMapper.toCreateDatabaseRequest(ticket),
      ).toEqual({
        numberOfTickets: 7,
        namespace: 'databases',
        deployment: 'postgres',
        dbName: 'billing',
      });
    });
  });
});
