import {
  BadGatewayException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { DatabaseManagementTicketEntity } from '../../common/database/database-management-ticket/database-management-ticket.entity';
import { DatabaseManagementTicketsRepository } from '../../common/database/database-management-ticket/database-management-tickets.repository';
import { DatabaseProvisioningTicketEntity } from '../../common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { DatabaseProvisioningTicketsRepository } from '../../common/database/database-provisioning-ticket/database-provisioning-tickets.repository';
import { ServerManagementTicketEntity } from '../../common/database/server-management-ticket/server-management-ticket.entity';
import { ServerManagementTicketsRepository } from '../../common/database/server-management-ticket/server-management-tickets.repository';
import { KubernetesManifestTicketEntity } from '../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { KubernetesManifestTicketsRepository } from '../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-tickets.repository';
import { KubectlCommandTicketEntity } from '../../common/database/kubectl-command-ticket/kubectl-command-ticket.entity';
import { KubectlCommandTicketsRepository } from '../../common/database/kubectl-command-ticket/kubectl-command-tickets.repository';
import { TicketStatus } from '../../common/database/ticket-status.enum';
import {
  InfraHubApiExecutionResult,
  InfraHubApiResponse,
} from '../infra-hub-api/infra-hub-api.types';
import { InfraHubApiService } from '../infra-hub-api/infra-hub-api.service';
import { DatabaseManagementTicketMapper } from '../create-ticket/mapper/database-management-ticket.mapper';
import { DatabaseProvisioningTicketMapper } from '../create-ticket/mapper/database-provisioning-ticket.mapper';
import { ServerManagementTicketMapper } from '../create-ticket/mapper/server-management-ticket.mapper';
import { KubernetesManifestTicketMapper } from '../create-ticket/mapper/kubernetes-manifest-ticket.mapper';
import { KubectlCommandTicketMapper } from '../create-ticket/mapper/kubectl-command-ticket.mapper';

interface ApprovableTicket {
  number: number;
  status: TicketStatus;
  response: string;
}

interface ApprovalRepository<T> {
  claimForApproval(number: number): Promise<boolean>;
  releaseClaim(number: number): Promise<boolean>;
  update(ticket: T): Promise<T>;
}

function isInfraHubRejection(error: unknown): boolean {
  if (!(error instanceof HttpException)) {
    return false;
  }
  const status = error.getStatus();
  return status >= 400 && status < 500;
}

function toLoggableError(error: unknown) {
  return {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  };
}

@Injectable()
export class UpdateTicketService {
  constructor(
    private readonly databaseManagementTicketsRepository: DatabaseManagementTicketsRepository,
    private readonly databaseProvisioningTicketsRepository: DatabaseProvisioningTicketsRepository,
    private readonly serverManagementTicketsRepository: ServerManagementTicketsRepository,
    private readonly kubernetesManifestTicketsRepository: KubernetesManifestTicketsRepository,
    private readonly kubectlCommandTicketsRepository: KubectlCommandTicketsRepository,
    private readonly infraHubApiService: InfraHubApiService,
    private readonly logger: Logger,
  ) {}

  async approveDatabaseManagementTicket(
    number: number,
  ): Promise<DatabaseManagementTicketEntity> {
    const ticket =
      await this.databaseManagementTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Database management ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    return this.approveClaimedTicket(
      this.databaseManagementTicketsRepository,
      ticket,
      'Database management',
      () =>
        this.infraHubApiService.manageDatabase(
          DatabaseManagementTicketMapper.toManageDatabaseRequest(ticket),
        ),
    );
  }

  async approveDatabaseProvisioningTicket(
    number: number,
  ): Promise<DatabaseProvisioningTicketEntity> {
    const ticket =
      await this.databaseProvisioningTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Database provisioning ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    return this.approveClaimedTicket(
      this.databaseProvisioningTicketsRepository,
      ticket,
      'Database provisioning',
      () =>
        this.infraHubApiService.createDatabase(
          DatabaseProvisioningTicketMapper.toCreateDatabaseRequest(ticket),
        ),
    );
  }

  async approveServerManagementTicket(
    number: number,
  ): Promise<ServerManagementTicketEntity> {
    const ticket =
      await this.serverManagementTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Server management ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    return this.approveClaimedTicket(
      this.serverManagementTicketsRepository,
      ticket,
      'Server management',
      () =>
        this.infraHubApiService.manageServerCommand(
          ServerManagementTicketMapper.toManageServerCommandRequest(ticket),
        ),
    );
  }

  async approveKubernetesManifestTicket(
    number: number,
  ): Promise<KubernetesManifestTicketEntity> {
    const ticket =
      await this.kubernetesManifestTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubernetes manifest ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    return this.approveClaimedTicket(
      this.kubernetesManifestTicketsRepository,
      ticket,
      'Kubernetes manifest',
      () =>
        this.infraHubApiService.manageKubernetesManifest(
          KubernetesManifestTicketMapper.toManageKubernetesManifestRequest(
            ticket,
          ),
        ),
    );
  }

  async approveKubectlCommandTicket(
    number: number,
  ): Promise<KubectlCommandTicketEntity> {
    const ticket =
      await this.kubectlCommandTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubectl command ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'approved');

    return this.approveClaimedTicket(
      this.kubectlCommandTicketsRepository,
      ticket,
      'Kubectl command',
      () =>
        this.infraHubApiService.executeKubectlCommand(
          KubectlCommandTicketMapper.toExecuteKubectlCommandRequest(ticket),
        ),
    );
  }

  async rejectDatabaseManagementTicket(
    number: number,
  ): Promise<DatabaseManagementTicketEntity> {
    const ticket =
      await this.databaseManagementTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Database management ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.databaseManagementTicketsRepository.update(ticket);
  }

  async rejectDatabaseProvisioningTicket(
    number: number,
  ): Promise<DatabaseProvisioningTicketEntity> {
    const ticket =
      await this.databaseProvisioningTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Database provisioning ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.databaseProvisioningTicketsRepository.update(ticket);
  }

  async rejectServerManagementTicket(
    number: number,
  ): Promise<ServerManagementTicketEntity> {
    const ticket =
      await this.serverManagementTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Server management ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.serverManagementTicketsRepository.update(ticket);
  }

  async rejectKubernetesManifestTicket(
    number: number,
  ): Promise<KubernetesManifestTicketEntity> {
    const ticket =
      await this.kubernetesManifestTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubernetes manifest ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.kubernetesManifestTicketsRepository.update(ticket);
  }

  async rejectKubectlCommandTicket(
    number: number,
  ): Promise<KubectlCommandTicketEntity> {
    const ticket =
      await this.kubectlCommandTicketsRepository.findByNumber(number);
    if (!ticket) {
      throw new NotFoundException(
        `Kubectl command ticket with number ${number} not found`,
      );
    }
    this.assertOpen(ticket.status, number, 'rejected');

    ticket.status = TicketStatus.REJECTED;
    return this.kubectlCommandTicketsRepository.update(ticket);
  }

  /**
   * Approves a ticket that was read as OPEN, in three steps:
   *
   * 1. Claim: an atomic conditional UPDATE (OPEN -> IN_PROGRESS). Only one of
   *    several concurrent approvals wins it; the others get a 409 and never
   *    reach infra-hub-api, so the action cannot run twice.
   * 2. Execute: call infra-hub-api.
   * 3. Settle: see {@link settleApproval} and {@link handleInfraHubFailure}.
   */
  private async approveClaimedTicket<T extends ApprovableTicket>(
    repository: ApprovalRepository<T>,
    ticket: T,
    ticketType: string,
    execute: () => Promise<InfraHubApiResponse>,
  ): Promise<T> {
    const claimed = await repository.claimForApproval(ticket.number);
    if (!claimed) {
      throw new ConflictException(
        `Ticket with number ${ticket.number} could not be approved: ` +
          'it was claimed by another request or it is no longer OPEN',
      );
    }

    let infraHubResponse: InfraHubApiResponse;
    try {
      infraHubResponse = await execute();
    } catch (error) {
      await this.handleInfraHubFailure(repository, ticket, ticketType, error);
      throw error;
    }

    return this.settleApproval(
      repository,
      ticket,
      ticketType,
      infraHubResponse.executionResult,
    );
  }

  /**
   * infra-hub-api did not answer with an execution result.
   *
   * - 4xx HttpException: the request was rejected and nothing was executed.
   *   The InfraHubApiConnector only builds an HttpException from an HTTP
   *   response of infra-hub-api, and in infra-hub-api every 4xx comes from the
   *   body ValidationPipe (400), JwtAuthGuard (401) or RolesGuard (403), all of
   *   which run before the controller starts any playbook. The ticket goes
   *   back to OPEN so it can be approved again.
   * - Anything else (5xx, timeout, network error, unknown error): the action
   *   may or may not have run, so the ticket is left IN_PROGRESS for an
   *   administrator to reconcile, and the error is logged.
   */
  private async handleInfraHubFailure<T extends ApprovableTicket>(
    repository: ApprovalRepository<T>,
    ticket: T,
    ticketType: string,
    error: unknown,
  ): Promise<void> {
    if (!isInfraHubRejection(error)) {
      this.logger.error({
        err: toLoggableError(error),
        ticketType,
        ticketNumber: ticket.number,
        msg: 'infra-hub-api failed with an unknown outcome; the action may have been executed, so the ticket is left IN_PROGRESS and must be reconciled by an administrator',
      });
      return;
    }

    try {
      await repository.releaseClaim(ticket.number);
    } catch (releaseError) {
      this.logger.error({
        err: toLoggableError(releaseError),
        ticketType,
        ticketNumber: ticket.number,
        msg: 'infra-hub-api rejected the request (nothing was executed) but the ticket could not be moved back to OPEN; it is still IN_PROGRESS',
      });
    }
  }

  /**
   * Records the outcome of an infra-hub-api execution on an IN_PROGRESS ticket.
   *
   * - `success: false`: the ticket is NOT approved. It goes back to OPEN, the
   *   execution result is kept in `response` so the approver can see why, and
   *   a 502 is answered so the approver can retry.
   * - `success: true`: the ticket becomes APPROVED. When that write fails the
   *   action HAS already run, so the ticket must NOT go back to OPEN (it would
   *   be approvable again): it stays IN_PROGRESS, the error is logged with
   *   everything needed to reconcile by hand and it is reported clearly.
   */
  private async settleApproval<T extends ApprovableTicket>(
    repository: ApprovalRepository<T>,
    ticket: T,
    ticketType: string,
    executionResult: InfraHubApiExecutionResult,
  ): Promise<T> {
    ticket.response = JSON.stringify(executionResult);

    if (executionResult.success === false) {
      ticket.status = TicketStatus.OPEN;
      const savedAsOpen = await this.saveOpenWithExecutionResult(
        repository,
        ticket,
        ticketType,
        executionResult,
      );
      throw new BadGatewayException(
        savedAsOpen
          ? `infra-hub-api reported that the execution for ${ticketType} ticket ${ticket.number} failed. ` +
              'The ticket stays OPEN and the execution result was saved in its response; it can be approved again.'
          : `infra-hub-api reported that the execution for ${ticketType} ticket ${ticket.number} failed. ` +
              'The ticket could not be moved back to OPEN and is still IN_PROGRESS: contact an administrator to reconcile it.',
      );
    }

    ticket.status = TicketStatus.APPROVED;
    try {
      return await repository.update(ticket);
    } catch (error) {
      this.logger.error({
        err: toLoggableError(error),
        ticketType,
        ticketNumber: ticket.number,
        executionResult,
        msg: 'infra-hub-api executed the ticket action but the APPROVED status could not be saved; the ticket is still IN_PROGRESS in the database',
      });
      throw new InternalServerErrorException(
        `The action of ${ticketType} ticket ${ticket.number} WAS executed by infra-hub-api, ` +
          'but the ticket status could not be saved and it is still IN_PROGRESS. ' +
          'Do not approve it again: contact an administrator to reconcile it.',
      );
    }
  }

  private async saveOpenWithExecutionResult<T extends ApprovableTicket>(
    repository: ApprovalRepository<T>,
    ticket: T,
    ticketType: string,
    executionResult: InfraHubApiExecutionResult,
  ): Promise<boolean> {
    try {
      await repository.update(ticket);
      return true;
    } catch (error) {
      this.logger.error({
        err: toLoggableError(error),
        ticketType,
        ticketNumber: ticket.number,
        executionResult,
        msg: 'infra-hub-api reported a failed execution but the ticket could not be moved back to OPEN with its result; it is still IN_PROGRESS',
      });
      return false;
    }
  }

  private assertOpen(
    status: TicketStatus,
    number: number,
    action: 'approved' | 'rejected',
  ): void {
    if (status !== TicketStatus.OPEN) {
      throw new ConflictException(
        `Ticket with number ${number} is already ${status}, it cannot be ${action}`,
      );
    }
  }
}
