import { describe, expect, it } from '@jest/globals';
import { DatabaseManagementTicketEntity } from '../../../../common/database/database-management-ticket/database-management-ticket.entity';
import { TicketStatus } from '../../../../common/database/ticket-status.enum';
import { CreateDatabaseManagementTicketDto } from '../../dto/create-database-management-ticket.dto';
import { DatabaseManagementTicketMapper } from '../../mapper/database-management-ticket.mapper';

function buildDto(
  overrides: Partial<CreateDatabaseManagementTicketDto> = {},
): CreateDatabaseManagementTicketDto {
  return Object.assign(new CreateDatabaseManagementTicketDto(), {
    informer: 'informer@example.com',
    assignee: 'assignee@example.com',
    department: 'DATA',
    subject: 'Add index',
    description: 'Add an index to the orders table',
    dbNamespace: 'databases',
    dbDeployment: 'postgres',
    dbName: 'orders',
    sqlCode: 'CREATE INDEX idx ON orders (id);',
    ...overrides,
  });
}

describe('DatabaseManagementTicketMapper', () => {
  describe('toEntity', () => {
    it('maps every dto field to the entity', () => {
      const dto = buildDto();

      const entity = DatabaseManagementTicketMapper.toEntity(dto);

      expect(entity).toBeInstanceOf(DatabaseManagementTicketEntity);
      expect(entity.informer).toBe(dto.informer);
      expect(entity.assignee).toBe(dto.assignee);
      expect(entity.department).toBe(dto.department);
      expect(entity.subject).toBe(dto.subject);
      expect(entity.description).toBe(dto.description);
      expect(entity.dbNamespace).toBe(dto.dbNamespace);
      expect(entity.dbDeployment).toBe(dto.dbDeployment);
      expect(entity.dbName).toBe(dto.dbName);
      expect(entity.sqlCode).toBe(dto.sqlCode);
    });

    it('sets the status to OPEN and an empty response', () => {
      const entity = DatabaseManagementTicketMapper.toEntity(buildDto());

      expect(entity.status).toBe(TicketStatus.OPEN);
      expect(entity.response).toBe('');
    });

    it('throws the builder error when the informer is not set yet', () => {
      const dto = buildDto({ informer: undefined });

      expect(() => DatabaseManagementTicketMapper.toEntity(dto)).toThrow(
        'Cannot build DatabaseManagementTicketEntity: missing required field "informer"',
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
      'dbName',
      'sqlCode',
    ] as const)(
      'throws the builder error for a whitespace-only %s',
      (field) => {
        const dto = buildDto({ [field]: '   ' });

        expect(() => DatabaseManagementTicketMapper.toEntity(dto)).toThrow(
          `Cannot build DatabaseManagementTicketEntity: missing required field "${field}"`,
        );
      },
    );
  });

  describe('toManageDatabaseRequest', () => {
    it('builds the request from the ticket', () => {
      const ticket = DatabaseManagementTicketMapper.toEntity(buildDto());
      ticket.number = 42;

      expect(
        DatabaseManagementTicketMapper.toManageDatabaseRequest(ticket),
      ).toEqual({
        numberOfTickets: 42,
        namespace: 'databases',
        deployment: 'postgres',
        dbName: 'orders',
        sqlCode: 'CREATE INDEX idx ON orders (id);',
      });
    });
  });
});
