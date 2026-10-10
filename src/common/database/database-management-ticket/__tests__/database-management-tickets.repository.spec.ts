import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { DataSource, Repository } from 'typeorm';
import { createInMemoryDataSource } from '../../../../../test/helpers/in-memory-db';
import { TicketStatus } from '../../ticket-status.enum';
import { DatabaseManagementTicketEntity } from '../database-management-ticket.entity';
import { DatabaseManagementTicketsRepository } from '../database-management-tickets.repository';

// @nestjs/typeorm is ESM-only and Jest runs as CommonJS. The repository is built
// by hand below, so the injection decorator can be a no-op.
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

function buildTicket(overrides: { subject?: string; dbName?: string } = {}) {
  return DatabaseManagementTicketEntity.builder()
    .withInformer('informer@example.com')
    .withAssignee('assignee@example.com')
    .withDepartment('DATA')
    .withSubject(overrides.subject ?? 'Run migration')
    .withStatus(TicketStatus.OPEN)
    .withDescription('Apply a schema migration')
    .withResponse('')
    .withDbNamespace('databases')
    .withDbDeployment('postgres')
    .withDbName(overrides.dbName ?? 'orders')
    .withSqlCode('ALTER TABLE orders ADD COLUMN note text;')
    .build();
}

describe('DatabaseManagementTicketsRepository (in-memory db)', () => {
  let dataSource: DataSource;
  let typeormRepository: Repository<DatabaseManagementTicketEntity>;
  let repository: DatabaseManagementTicketsRepository;

  beforeAll(async () => {
    dataSource = await createInMemoryDataSource([
      DatabaseManagementTicketEntity,
    ]);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    typeormRepository = dataSource.getRepository(
      DatabaseManagementTicketEntity,
    );
    await typeormRepository.clear();
    repository = new DatabaseManagementTicketsRepository(typeormRepository);
  });

  describe('create', () => {
    it('persists the ticket and returns it with generated fields', async () => {
      const saved = await repository.create(buildTicket());

      expect(saved.id).toEqual(expect.any(Number));
      expect(saved.number).toEqual(expect.any(Number));
      expect(saved.status).toBe(TicketStatus.OPEN);
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(await typeormRepository.count()).toBe(1);
    });

    it('rejects a duplicated number (unique constraint)', async () => {
      const first = await repository.create(buildTicket());
      const second = await repository.create(buildTicket());

      // TypeORM ignores an explicit value for a generated column on INSERT, so
      // the duplicate is forced with an UPDATE through the query builder.
      const duplicateNumberUpdate = typeormRepository
        .createQueryBuilder()
        .update()
        .set({ number: first.number })
        .where('id = :id', { id: second.id })
        .execute();

      await expect(duplicateNumberUpdate).rejects.toThrow(
        /duplicate key value violates unique constraint[\s\S]*Key \(number\)=\(\d+\) already exists/,
      );
      expect(await typeormRepository.count()).toBe(2);
    });

    it('assigns a different number to each ticket', async () => {
      const first = await repository.create(buildTicket());
      const second = await repository.create(buildTicket());

      expect(second.number).not.toBe(first.number);
    });

    it('rejects a subject longer than the column length', async () => {
      const ticket = buildTicket({ subject: 'x'.repeat(501) });

      await expect(repository.create(ticket)).rejects.toThrow();
      expect(await typeormRepository.count()).toBe(0);
    });

    it('rejects a database name longer than the column length', async () => {
      const ticket = buildTicket({ dbName: 'x'.repeat(51) });

      await expect(repository.create(ticket)).rejects.toThrow();
      expect(await typeormRepository.count()).toBe(0);
    });

    it('persists every ticket status value', async () => {
      for (const status of Object.values(TicketStatus)) {
        const ticket = buildTicket();
        ticket.status = status;
        const saved = await repository.create(ticket);

        const found = await repository.findByNumber(saved.number);
        expect(found?.status).toBe(status);
      }
    });
  });

  describe('findAll', () => {
    it('returns an empty list when there are no tickets', async () => {
      expect(await repository.findAll()).toEqual([]);
    });

    it('returns every stored ticket ordered by number ascending', async () => {
      await repository.create(buildTicket({ subject: 'one' }));
      await repository.create(buildTicket({ subject: 'two' }));
      await repository.create(buildTicket({ subject: 'three' }));
      const findSpy = jest.spyOn(typeormRepository, 'find');

      const tickets = await repository.findAll();

      expect(findSpy).toHaveBeenCalledWith({ order: { number: 'ASC' } });
      expect(tickets.map((ticket) => ticket.subject)).toEqual([
        'one',
        'two',
        'three',
      ]);
      const numbers = tickets.map((ticket) => ticket.number);
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    });
  });

  describe('findByNumber', () => {
    it('returns the ticket with the given number', async () => {
      const saved = await repository.create(buildTicket());

      const found = await repository.findByNumber(saved.number);

      expect(found?.id).toBe(saved.id);
      expect(found?.dbName).toBe('orders');
      expect(found?.sqlCode).toBe('ALTER TABLE orders ADD COLUMN note text;');
    });

    it('returns null when the number does not exist', async () => {
      expect(await repository.findByNumber(9999)).toBeNull();
    });
  });

  describe('update', () => {
    it('persists a status and response change on an existing ticket', async () => {
      const saved = await repository.create(buildTicket());

      saved.status = TicketStatus.APPROVED;
      saved.response = '{"ok":true}';
      const updated = await repository.update(saved);

      expect(updated.id).toBe(saved.id);
      const found = await repository.findByNumber(saved.number);
      expect(found?.status).toBe(TicketStatus.APPROVED);
      expect(found?.response).toBe('{"ok":true}');
    });

    it('updates the existing row instead of inserting a new one', async () => {
      const saved = await repository.create(buildTicket());

      saved.status = TicketStatus.REJECTED;
      await repository.update(saved);

      expect(await typeormRepository.count()).toBe(1);
      expect((await repository.findByNumber(saved.number))?.id).toBe(saved.id);
    });
  });

  describe('claimForApproval', () => {
    it('moves an OPEN ticket to IN_PROGRESS and returns true', async () => {
      const saved = await repository.create(buildTicket());

      const claimed = await repository.claimForApproval(saved.number);

      expect(claimed).toBe(true);
      const found = await repository.findByNumber(saved.number);
      expect(found?.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('lets only the first of two claims win', async () => {
      const saved = await repository.create(buildTicket());

      const first = await repository.claimForApproval(saved.number);
      const second = await repository.claimForApproval(saved.number);

      expect(first).toBe(true);
      expect(second).toBe(false);
    });

    it('lets exactly one of two simultaneous claims win', async () => {
      const saved = await repository.create(buildTicket());

      const results = await Promise.all([
        repository.claimForApproval(saved.number),
        repository.claimForApproval(saved.number),
      ]);

      expect(results.filter(Boolean)).toHaveLength(1);
    });

    it('returns false and changes nothing when the ticket is APPROVED', async () => {
      const saved = await repository.create(buildTicket());
      await typeormRepository.update(
        { id: saved.id },
        { status: TicketStatus.APPROVED },
      );

      expect(await repository.claimForApproval(saved.number)).toBe(false);

      const found = await repository.findByNumber(saved.number);
      expect(found?.status).toBe(TicketStatus.APPROVED);
    });

    it('returns false and changes nothing when the ticket is REJECTED', async () => {
      const saved = await repository.create(buildTicket());
      await typeormRepository.update(
        { id: saved.id },
        { status: TicketStatus.REJECTED },
      );

      expect(await repository.claimForApproval(saved.number)).toBe(false);

      const found = await repository.findByNumber(saved.number);
      expect(found?.status).toBe(TicketStatus.REJECTED);
    });

    it('returns false when the ticket does not exist', async () => {
      expect(await repository.claimForApproval(9999)).toBe(false);
    });

    it('only claims the ticket with the given number', async () => {
      const target = await repository.create(buildTicket());
      const other = await repository.create(buildTicket());

      await repository.claimForApproval(target.number);

      const untouched = await repository.findByNumber(other.number);
      expect(untouched?.status).toBe(TicketStatus.OPEN);
    });
  });

  describe('IN_PROGRESS status', () => {
    it('persists IN_PROGRESS through update', async () => {
      const saved = await repository.create(buildTicket());

      saved.status = TicketStatus.IN_PROGRESS;
      await repository.update(saved);

      const found = await repository.findByNumber(saved.number);
      expect(found?.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('persists IN_PROGRESS on create', async () => {
      const ticket = buildTicket();
      ticket.status = TicketStatus.IN_PROGRESS;

      const saved = await repository.create(ticket);

      expect((await repository.findByNumber(saved.number))?.status).toBe(
        TicketStatus.IN_PROGRESS,
      );
    });

    it('returns IN_PROGRESS tickets from findAll', async () => {
      const saved = await repository.create(buildTicket());
      await repository.claimForApproval(saved.number);

      const tickets = await repository.findAll();

      expect(tickets.map((ticket) => ticket.status)).toEqual([
        TicketStatus.IN_PROGRESS,
      ]);
    });
  });

  describe('entity builder', () => {
    it('throws when a required field is missing', () => {
      const builder = DatabaseManagementTicketEntity.builder()
        .withInformer('informer@example.com')
        .withAssignee('assignee@example.com')
        .withDepartment('DATA')
        .withSubject('Run migration')
        .withStatus(TicketStatus.OPEN)
        .withDescription('Apply a schema migration')
        .withResponse('')
        .withDbNamespace('databases')
        .withDbDeployment('postgres')
        .withDbName('orders');

      expect(() => builder.build()).toThrow(
        'Cannot build DatabaseManagementTicketEntity: missing required field "sqlCode"',
      );
    });
  });
});
