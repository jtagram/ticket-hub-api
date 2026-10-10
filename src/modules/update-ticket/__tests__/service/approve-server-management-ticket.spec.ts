import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  BadGatewayException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
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
  claimForApproval: jest.Mock<(number: number) => Promise<boolean>>;
  update: jest.Mock<(ticket: unknown) => Promise<unknown>>;
};

function buildRepository(): RepositoryMock {
  return {
    findByNumber: jest.fn<(number: number) => Promise<unknown>>(),
    claimForApproval: jest
      .fn<(number: number) => Promise<boolean>>()
      .mockResolvedValue(true),
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
    codeAnsible: '- hosts: all',
    ...overrides,
  };
}

const executionResult = {
  success: true,
  stdout: 'done',
  stderr: '',
  exitCode: 0,
};

describe('UpdateTicketService.approveServerManagementTicket', () => {
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
    target = repositories.srv;
    others = [
      repositories.dbm,
      repositories.dbp,
      repositories.kmf,
      repositories.kub,
    ];
    otherInfra = [
      infra.manageDatabase,
      infra.createDatabase,
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
    infra.manageServerCommand.mockResolvedValue({
      executionResult,
      logId: 'log-1',
    });
    target.update.mockResolvedValue({});

    await service.approveServerManagementTicket(42);

    expect(target.findByNumber).toHaveBeenCalledTimes(1);
    expect(target.findByNumber).toHaveBeenCalledWith(42);
  });

  it('throws NotFoundException when the ticket does not exist', async () => {
    target.findByNumber.mockResolvedValue(null);

    await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('reports the type and the number in the not-found message', async () => {
    target.findByNumber.mockResolvedValue(null);

    await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
      'Server management ticket with number 42 not found',
    );
  });

  it('neither calls infra-hub-api nor updates when the ticket does not exist', async () => {
    target.findByNumber.mockResolvedValue(null);

    await expect(service.approveServerManagementTicket(42)).rejects.toThrow();

    Object.values(infra).forEach((mock) => expect(mock).not.toHaveBeenCalled());
    expect(target.update).not.toHaveBeenCalled();
  });

  it('throws ConflictException when the ticket is already APPROVED', async () => {
    target.findByNumber.mockResolvedValue(
      buildTicket({ status: TicketStatus.APPROVED }),
    );

    await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
      ConflictException,
    );
    await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
      'Ticket with number 42 is already APPROVED, it cannot be approved',
    );
  });

  it('throws ConflictException when the ticket is already REJECTED', async () => {
    target.findByNumber.mockResolvedValue(
      buildTicket({ status: TicketStatus.REJECTED }),
    );

    await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
      ConflictException,
    );
    await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
      'Ticket with number 42 is already REJECTED, it cannot be approved',
    );
  });

  it('neither calls infra-hub-api nor updates when the ticket is not OPEN', async () => {
    target.findByNumber.mockResolvedValue(
      buildTicket({ status: TicketStatus.APPROVED }),
    );

    await expect(service.approveServerManagementTicket(42)).rejects.toThrow();

    Object.values(infra).forEach((mock) => expect(mock).not.toHaveBeenCalled());
    expect(target.update).not.toHaveBeenCalled();
  });

  it('sends the mapped request to the matching infra-hub-api operation', async () => {
    target.findByNumber.mockResolvedValue(buildTicket());
    infra.manageServerCommand.mockResolvedValue({
      executionResult,
      logId: 'log-1',
    });
    target.update.mockResolvedValue({});

    await service.approveServerManagementTicket(42);

    expect(infra.manageServerCommand).toHaveBeenCalledTimes(1);
    expect(infra.manageServerCommand).toHaveBeenCalledWith({
      numberOfTickets: 42,
      playbook: '- hosts: all',
    });
  });

  it('does not call any other infra-hub-api operation', async () => {
    target.findByNumber.mockResolvedValue(buildTicket());
    infra.manageServerCommand.mockResolvedValue({
      executionResult,
      logId: 'log-1',
    });
    target.update.mockResolvedValue({});

    await service.approveServerManagementTicket(42);

    otherInfra.forEach((mock) => expect(mock).not.toHaveBeenCalled());
  });

  it('marks the ticket APPROVED and stores the serialized execution result as its response', async () => {
    const ticket = buildTicket();
    target.findByNumber.mockResolvedValue(ticket);
    infra.manageServerCommand.mockResolvedValue({
      executionResult,
      logId: 'log-1',
    });
    target.update.mockResolvedValue({});

    await service.approveServerManagementTicket(42);

    expect(target.update).toHaveBeenCalledTimes(1);
    expect(target.update).toHaveBeenCalledWith(ticket);
    expect(ticket.status).toBe(TicketStatus.APPROVED);
    expect(ticket.response).toBe(JSON.stringify(executionResult));
  });

  it('stores only the execution result, not the whole infra-hub-api payload', async () => {
    const ticket = buildTicket();
    target.findByNumber.mockResolvedValue(ticket);
    infra.manageServerCommand.mockResolvedValue({
      executionResult,
      logId: 'log-1',
    });
    target.update.mockResolvedValue({});

    await service.approveServerManagementTicket(42);

    expect(ticket.response).not.toContain('logId');
  });

  it('updates the ticket only after infra-hub-api answered', async () => {
    const order: string[] = [];
    target.findByNumber.mockResolvedValue(buildTicket());
    infra.manageServerCommand.mockImplementation(async () => {
      order.push('infra');
      return { executionResult, logId: 'log-1' };
    });
    target.update.mockImplementation(async () => {
      order.push('update');
      return {};
    });

    await service.approveServerManagementTicket(42);

    expect(order).toEqual(['infra', 'update']);
  });

  it('returns what the repository update returns', async () => {
    const saved = { id: 1, number: 42, status: TicketStatus.APPROVED };
    target.findByNumber.mockResolvedValue(buildTicket());
    infra.manageServerCommand.mockResolvedValue({
      executionResult,
      logId: 'log-1',
    });
    target.update.mockResolvedValue(saved);

    await expect(service.approveServerManagementTicket(42)).resolves.toBe(
      saved,
    );
  });

  describe('when infra-hub-api reports success false', () => {
    const failedExecution = {
      success: false,
      stdout: '',
      stderr: 'permission denied',
      exitCode: 1,
      errorMessage: 'failed',
    };

    function arrangeFailedExecution() {
      const ticket = buildTicket();
      target.findByNumber.mockResolvedValue(ticket);
      infra.manageServerCommand.mockResolvedValue({
        executionResult: failedExecution,
        logId: 'log-2',
      });
      target.update.mockResolvedValue({});
      return ticket;
    }

    it('does not approve the ticket and answers 502 with a clear message', async () => {
      arrangeFailedExecution();

      const error = await service
        .approveServerManagementTicket(42)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadGatewayException);
      expect((error as BadGatewayException).getStatus()).toBe(502);
      expect((error as BadGatewayException).message).toBe(
        'infra-hub-api reported that the execution for Server management ticket 42 failed. ' +
          'The ticket stays IN_PROGRESS and the execution result was saved in its response; it will not be executed again.',
      );
    });

    it('keeps the ticket IN_PROGRESS and stores the execution result in its response', async () => {
      const ticket = arrangeFailedExecution();

      await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
        BadGatewayException,
      );

      expect(target.update).toHaveBeenCalledTimes(1);
      expect(target.update).toHaveBeenCalledWith(ticket);
      expect(ticket.status).toBe(TicketStatus.IN_PROGRESS);
      expect(ticket.response).toBe(JSON.stringify(failedExecution));
    });

    it('still answers 502 and logs when saving the failure result fails', async () => {
      arrangeFailedExecution();
      target.update.mockRejectedValue(new Error('database unavailable'));

      await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
        BadGatewayException,
      );

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketType: 'Server management',
          ticketNumber: 42,
          executionResult: failedExecution,
        }),
      );
    });
  });

  describe('when the update fails after infra-hub-api succeeded', () => {
    function arrangeFailedUpdate() {
      target.findByNumber.mockResolvedValue(buildTicket());
      infra.manageServerCommand.mockResolvedValue({
        executionResult,
        logId: 'log-1',
      });
      target.update.mockRejectedValue(new Error('database unavailable'));
    }

    it('throws an error saying the action WAS executed but the status could not be saved', async () => {
      arrangeFailedUpdate();

      const error = await service
        .approveServerManagementTicket(42)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect((error as InternalServerErrorException).message).toBe(
        'The action of Server management ticket 42 WAS executed by infra-hub-api, ' +
          'but the ticket status could not be saved and it is still IN_PROGRESS. ' +
          'Do not approve it again: contact an administrator to reconcile it.',
      );
    });

    it('logs the ticket type, number, execution result and the underlying error', async () => {
      arrangeFailedUpdate();

      await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketType: 'Server management',
          ticketNumber: 42,
          executionResult,
          err: expect.objectContaining({ message: 'database unavailable' }),
        }),
      );
    });
  });

  it('does not log an error on a successful approval', async () => {
    target.findByNumber.mockResolvedValue(buildTicket());
    infra.manageServerCommand.mockResolvedValue({
      executionResult,
      logId: 'log-1',
    });
    target.update.mockResolvedValue({});

    await service.approveServerManagementTicket(42);

    expect(logger.error).not.toHaveBeenCalled();
  });

  it('propagates a repository lookup rejection', async () => {
    const failure = new Error('database unavailable');
    target.findByNumber.mockRejectedValue(failure);

    await expect(service.approveServerManagementTicket(42)).rejects.toBe(
      failure,
    );

    Object.values(infra).forEach((mock) => expect(mock).not.toHaveBeenCalled());
  });

  it('does not use any other repository', async () => {
    target.findByNumber.mockResolvedValue(buildTicket());
    infra.manageServerCommand.mockResolvedValue({
      executionResult,
      logId: 'log-1',
    });
    target.update.mockResolvedValue({});

    await service.approveServerManagementTicket(42);

    others.forEach((mock) => {
      expect(mock.findByNumber).not.toHaveBeenCalled();
      expect(mock.update).not.toHaveBeenCalled();
      expect(mock.claimForApproval).not.toHaveBeenCalled();
    });
  });

  describe('claiming the ticket', () => {
    function arrangeSuccess() {
      target.findByNumber.mockResolvedValue(buildTicket());
      infra.manageServerCommand.mockResolvedValue({
        executionResult,
        logId: 'log-1',
      });
      target.update.mockResolvedValue({});
    }

    it('claims the ticket by number in its own repository', async () => {
      arrangeSuccess();

      await service.approveServerManagementTicket(42);

      expect(target.claimForApproval).toHaveBeenCalledTimes(1);
      expect(target.claimForApproval).toHaveBeenCalledWith(42);
    });

    it('claims the ticket before calling infra-hub-api', async () => {
      const order: string[] = [];
      target.findByNumber.mockResolvedValue(buildTicket());
      target.claimForApproval.mockImplementation(async () => {
        order.push('claim');
        return true;
      });
      infra.manageServerCommand.mockImplementation(async () => {
        order.push('infra');
        return { executionResult, logId: 'log-1' };
      });
      target.update.mockResolvedValue({});

      await service.approveServerManagementTicket(42);

      expect(order).toEqual(['claim', 'infra']);
    });

    it('throws ConflictException when another request already claimed the ticket', async () => {
      target.findByNumber.mockResolvedValue(buildTicket());
      target.claimForApproval.mockResolvedValue(false);

      const error = await service
        .approveServerManagementTicket(42)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).message).toBe(
        'Ticket with number 42 could not be approved: ' +
          'it was claimed by another request or it is no longer OPEN',
      );
    });

    it('neither calls infra-hub-api nor updates when the claim is lost', async () => {
      target.findByNumber.mockResolvedValue(buildTicket());
      target.claimForApproval.mockResolvedValue(false);

      await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
        ConflictException,
      );

      Object.values(infra).forEach((mock) =>
        expect(mock).not.toHaveBeenCalled(),
      );
      expect(target.update).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the ticket is already IN_PROGRESS', async () => {
      target.findByNumber.mockResolvedValue(
        buildTicket({ status: TicketStatus.IN_PROGRESS }),
      );

      await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
        'Ticket with number 42 is already IN_PROGRESS, it cannot be approved',
      );
    });

    it('does not even try to claim a ticket that is not OPEN', async () => {
      target.findByNumber.mockResolvedValue(
        buildTicket({ status: TicketStatus.IN_PROGRESS }),
      );

      await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
        ConflictException,
      );

      expect(target.claimForApproval).not.toHaveBeenCalled();
    });

    it('propagates a claim rejection without calling infra-hub-api', async () => {
      const failure = new Error('database unavailable');
      target.findByNumber.mockResolvedValue(buildTicket());
      target.claimForApproval.mockRejectedValue(failure);

      await expect(service.approveServerManagementTicket(42)).rejects.toBe(
        failure,
      );

      Object.values(infra).forEach((mock) =>
        expect(mock).not.toHaveBeenCalled(),
      );
    });

    it('answers 502 telling the ticket is still IN_PROGRESS when the failed result cannot be saved', async () => {
      target.findByNumber.mockResolvedValue(buildTicket());
      infra.manageServerCommand.mockResolvedValue({
        executionResult: { ...executionResult, success: false },
        logId: 'log-2',
      });
      target.update.mockRejectedValue(new Error('database unavailable'));

      const error = await service
        .approveServerManagementTicket(42)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(BadGatewayException);
      expect((error as BadGatewayException).message).toBe(
        'infra-hub-api reported that the execution for Server management ticket 42 failed. ' +
          'The ticket is still IN_PROGRESS but the execution result could not be saved: contact an administrator to reconcile it.',
      );
    });
  });

  describe('when infra-hub-api rejects the request with a 4xx', () => {
    function arrangeRejection(status = 422) {
      const rejection = new HttpException(
        { statusCode: status, message: 'The request payload is invalid' },
        status,
      );
      target.findByNumber.mockResolvedValue(buildTicket());
      infra.manageServerCommand.mockRejectedValue(rejection);
      return rejection;
    }

    it('rethrows the very same error', async () => {
      const rejection = arrangeRejection();

      await expect(service.approveServerManagementTicket(42)).rejects.toBe(
        rejection,
      );
    });

    it('never moves the ticket back to OPEN: the repository has no releaseClaim', async () => {
      arrangeRejection();

      await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
        HttpException,
      );

      expect(target).not.toHaveProperty('releaseClaim');
      expect(target.update).not.toHaveBeenCalled();
    });

    it('behaves the same on the lowest 4xx status (400)', async () => {
      const rejection = arrangeRejection(400);

      await expect(service.approveServerManagementTicket(42)).rejects.toBe(
        rejection,
      );

      expect(target.update).not.toHaveBeenCalled();
    });

    it('does not save the ticket and logs an error leaving it IN_PROGRESS', async () => {
      const rejection = arrangeRejection();

      await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
        HttpException,
      );

      expect(target.update).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketType: 'Server management',
          ticketNumber: 42,
          err: expect.objectContaining({ message: rejection.message }),
        }),
      );
    });
  });

  describe('when the outcome of infra-hub-api is unknown', () => {
    it('leaves the ticket IN_PROGRESS after a 5xx answer and rethrows the same error', async () => {
      const failure = new HttpException(
        { statusCode: 502, message: 'Bad gateway from infra-hub-api' },
        502,
      );
      target.findByNumber.mockResolvedValue(buildTicket());
      infra.manageServerCommand.mockRejectedValue(failure);

      await expect(service.approveServerManagementTicket(42)).rejects.toBe(
        failure,
      );

      expect(target.update).not.toHaveBeenCalled();
    });

    it('leaves the ticket IN_PROGRESS after a 500 answer', async () => {
      const failure = new HttpException(
        { statusCode: 500, message: 'Internal Server Error' },
        500,
      );
      target.findByNumber.mockResolvedValue(buildTicket());
      infra.manageServerCommand.mockRejectedValue(failure);

      await expect(service.approveServerManagementTicket(42)).rejects.toBe(
        failure,
      );

    });

    it('leaves the ticket IN_PROGRESS after a network or timeout error and rethrows it', async () => {
      const failure = new Error('timeout of 30000ms exceeded');
      target.findByNumber.mockResolvedValue(buildTicket());
      infra.manageServerCommand.mockRejectedValue(failure);

      await expect(service.approveServerManagementTicket(42)).rejects.toBe(
        failure,
      );

      expect(target.update).not.toHaveBeenCalled();
    });

    it('logs an error with the ticket type, number and underlying error', async () => {
      target.findByNumber.mockResolvedValue(buildTicket());
      infra.manageServerCommand.mockRejectedValue(
        new Error('connect ECONNRESET'),
      );

      await expect(service.approveServerManagementTicket(42)).rejects.toThrow(
        'connect ECONNRESET',
      );

      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketType: 'Server management',
          ticketNumber: 42,
          err: expect.objectContaining({ message: 'connect ECONNRESET' }),
        }),
      );
    });

    it('logs a non-Error rejection as a string message', async () => {
      target.findByNumber.mockResolvedValue(buildTicket());
      infra.manageServerCommand.mockRejectedValue('plain failure');

      await expect(service.approveServerManagementTicket(42)).rejects.toBe(
        'plain failure',
      );

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: { message: 'plain failure', stack: undefined },
        }),
      );
    });
  });
});
