import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TicketStatus } from '../../../../common/database/ticket-status.enum';
import { UpdateTicketService } from '../../update-ticket.service';

// @nestjs/typeorm is ESM-only and Jest runs as CommonJS. The code under test is
// built by hand below, so the injection decorator can be a no-op.
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));
// The infra-hub-api connector reaches ESM-only packages (@nestjs/axios, @nestjs/config).
jest.mock('@nestjs/axios', () => ({ HttpService: class HttpService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

type RepositoryMock = {
  findByNumber: jest.Mock<(number: number) => Promise<unknown>>;
  update: jest.Mock<(ticket: unknown) => Promise<unknown>>;
};

function buildRepository(): RepositoryMock {
  return {
    findByNumber: jest.fn<(number: number) => Promise<unknown>>(),
    update: jest.fn<(ticket: unknown) => Promise<unknown>>(),
  };
}

type InfraMock = jest.Mock<(request: unknown) => Promise<unknown>>;

function buildInfraMock(): InfraMock {
  return jest.fn<(request: unknown) => Promise<unknown>>();
}

function buildTicket(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    number: 42,
    informer: 'informer@example.com',
    assignee: 'assignee@example.com',
    department: 'INFRA',
    subject: 'Subject',
    description: 'Description',
    status: TicketStatus.OPEN,
    response: '',
    dbNamespace: 'databases',
    dbDeployment: 'postgres',
    dbName: 'orders',
    sqlCode: 'SELECT 1;',
    ...overrides,
  };
}

describe('UpdateTicketService.rejectDatabaseManagementTicket', () => {
  let target: RepositoryMock;
  let others: RepositoryMock[];
  let infra: Record<string, InfraMock>;
  let otherInfra: InfraMock[];
  let service: UpdateTicketService;
  let logger: { error: jest.Mock };

  beforeEach(() => {
    const repositories = {
      dbm: buildRepository(),
      dbp: buildRepository(),
      srv: buildRepository(),
      kmf: buildRepository(),
      kub: buildRepository(),
    };
    infra = {
      manageDatabase: buildInfraMock(),
      createDatabase: buildInfraMock(),
      manageServerCommand: buildInfraMock(),
      manageKubernetesManifest: buildInfraMock(),
      executeKubectlCommand: buildInfraMock(),
    };
    target = repositories.dbm;
    others = [
      repositories.dbp,
      repositories.srv,
      repositories.kmf,
      repositories.kub,
    ];
    otherInfra = [
      infra.createDatabase,
      infra.manageServerCommand,
      infra.manageKubernetesManifest,
      infra.executeKubectlCommand,
    ];
    logger = { error: jest.fn() };
    service = new UpdateTicketService(
      repositories.dbm as never,
      repositories.dbp as never,
      repositories.srv as never,
      repositories.kmf as never,
      repositories.kub as never,
      infra as never,
      logger as never,
    );
  });

  it('looks the ticket up by number in its own repository', async () => {
    target.findByNumber.mockResolvedValue(buildTicket());
    target.update.mockResolvedValue({});

    await service.rejectDatabaseManagementTicket(42);

    expect(target.findByNumber).toHaveBeenCalledTimes(1);
    expect(target.findByNumber).toHaveBeenCalledWith(42);
  });

  it('throws NotFoundException when the ticket does not exist', async () => {
    target.findByNumber.mockResolvedValue(null);

    await expect(service.rejectDatabaseManagementTicket(42)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('reports the type and the number in the not-found message', async () => {
    target.findByNumber.mockResolvedValue(null);

    await expect(service.rejectDatabaseManagementTicket(42)).rejects.toThrow(
      'Database management ticket with number 42 not found',
    );
  });

  it('does not update when the ticket does not exist', async () => {
    target.findByNumber.mockResolvedValue(null);

    await expect(service.rejectDatabaseManagementTicket(42)).rejects.toThrow();

    expect(target.update).not.toHaveBeenCalled();
  });

  it('throws ConflictException when the ticket is already APPROVED', async () => {
    target.findByNumber.mockResolvedValue(
      buildTicket({ status: TicketStatus.APPROVED }),
    );

    await expect(service.rejectDatabaseManagementTicket(42)).rejects.toThrow(
      ConflictException,
    );
    await expect(service.rejectDatabaseManagementTicket(42)).rejects.toThrow(
      'Ticket with number 42 is already APPROVED, it cannot be rejected',
    );
  });

  it('throws ConflictException when the ticket is already REJECTED', async () => {
    target.findByNumber.mockResolvedValue(
      buildTicket({ status: TicketStatus.REJECTED }),
    );

    await expect(service.rejectDatabaseManagementTicket(42)).rejects.toThrow(
      ConflictException,
    );
    await expect(service.rejectDatabaseManagementTicket(42)).rejects.toThrow(
      'Ticket with number 42 is already REJECTED, it cannot be rejected',
    );
  });

  it('throws ConflictException when the ticket is IN_PROGRESS', async () => {
    target.findByNumber.mockResolvedValue(
      buildTicket({ status: TicketStatus.IN_PROGRESS }),
    );

    await expect(service.rejectDatabaseManagementTicket(42)).rejects.toThrow(
      ConflictException,
    );
    await expect(service.rejectDatabaseManagementTicket(42)).rejects.toThrow(
      'Ticket with number 42 is already IN_PROGRESS, it cannot be rejected',
    );
  });

  it('does not update when the ticket is IN_PROGRESS', async () => {
    target.findByNumber.mockResolvedValue(
      buildTicket({ status: TicketStatus.IN_PROGRESS }),
    );

    await expect(service.rejectDatabaseManagementTicket(42)).rejects.toThrow();

    expect(target.update).not.toHaveBeenCalled();
  });

  it('does not update when the ticket is not OPEN', async () => {
    target.findByNumber.mockResolvedValue(
      buildTicket({ status: TicketStatus.APPROVED }),
    );

    await expect(service.rejectDatabaseManagementTicket(42)).rejects.toThrow();

    expect(target.update).not.toHaveBeenCalled();
  });

  it('marks the ticket REJECTED and passes it to the repository update', async () => {
    const ticket = buildTicket();
    target.findByNumber.mockResolvedValue(ticket);
    target.update.mockResolvedValue({});

    await service.rejectDatabaseManagementTicket(42);

    expect(target.update).toHaveBeenCalledTimes(1);
    expect(target.update).toHaveBeenCalledWith(ticket);
    expect(ticket.status).toBe(TicketStatus.REJECTED);
  });

  it('leaves the ticket response untouched', async () => {
    const ticket = buildTicket({ response: 'previous note' });
    target.findByNumber.mockResolvedValue(ticket);
    target.update.mockResolvedValue({});

    await service.rejectDatabaseManagementTicket(42);

    expect(ticket.response).toBe('previous note');
  });

  it('never calls infra-hub-api', async () => {
    target.findByNumber.mockResolvedValue(buildTicket());
    target.update.mockResolvedValue({});

    await service.rejectDatabaseManagementTicket(42);

    Object.values(infra).forEach((mock) => expect(mock).not.toHaveBeenCalled());
  });

  it('returns what the repository update returns', async () => {
    const saved = { id: 1, number: 42, status: TicketStatus.REJECTED };
    target.findByNumber.mockResolvedValue(buildTicket());
    target.update.mockResolvedValue(saved);

    await expect(service.rejectDatabaseManagementTicket(42)).resolves.toBe(
      saved,
    );
  });

  it('propagates a repository update rejection', async () => {
    const failure = new Error('database unavailable');
    target.findByNumber.mockResolvedValue(buildTicket());
    target.update.mockRejectedValue(failure);

    await expect(service.rejectDatabaseManagementTicket(42)).rejects.toBe(
      failure,
    );
  });

  it('propagates a repository lookup rejection', async () => {
    const failure = new Error('database unavailable');
    target.findByNumber.mockRejectedValue(failure);

    await expect(service.rejectDatabaseManagementTicket(42)).rejects.toBe(
      failure,
    );
  });

  it('does not use any other repository', async () => {
    target.findByNumber.mockResolvedValue(buildTicket());
    target.update.mockResolvedValue({});

    await service.rejectDatabaseManagementTicket(42);

    others.forEach((mock) => {
      expect(mock.findByNumber).not.toHaveBeenCalled();
      expect(mock.update).not.toHaveBeenCalled();
    });
  });
});
