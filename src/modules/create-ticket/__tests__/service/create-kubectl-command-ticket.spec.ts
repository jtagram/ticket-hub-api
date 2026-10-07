import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { TicketStatus } from '../../../../common/database/ticket-status.enum';
import { DatabaseManagementTicketsRepository } from '../../../../common/database/database-management-ticket/database-management-tickets.repository';
import { DatabaseProvisioningTicketsRepository } from '../../../../common/database/database-provisioning-ticket/database-provisioning-tickets.repository';
import { ServerManagementTicketsRepository } from '../../../../common/database/server-management-ticket/server-management-tickets.repository';
import { KubernetesManifestTicketsRepository } from '../../../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-tickets.repository';
import { KubectlCommandTicketsRepository } from '../../../../common/database/kubectl-command-ticket/kubectl-command-tickets.repository';
import { CreateTicketService } from '../../create-ticket.service';

// @nestjs/typeorm is ESM-only and Jest runs as CommonJS. The service is built
// by hand below, so the injection decorator can be a no-op.
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

type RepositoryMock = {
  create: jest.Mock<(ticket: unknown) => Promise<unknown>>;
};

const dto = {
  informer: 'informer@example.com',
  assignee: 'assignee@example.com',
  department: 'INFRA',
  subject: 'Subject',
  description: 'Description',
  kubectlCommand: 'kubectl get pods',
};

describe('CreateTicketService.createKubectlCommandTicket', () => {
  let target: RepositoryMock;
  let others: RepositoryMock[];
  let service: CreateTicketService;

  beforeEach(() => {
    const buildRepository = (): RepositoryMock => ({
      create: jest.fn<(ticket: unknown) => Promise<unknown>>(),
    });
    target = buildRepository();
    const databaseManagement = buildRepository();
    const databaseProvisioning = buildRepository();
    const serverManagement = buildRepository();
    const kubernetesManifest = buildRepository();
    others = [
      databaseManagement,
      databaseProvisioning,
      serverManagement,
      kubernetesManifest,
    ];
    service = new CreateTicketService(
      databaseManagement as unknown as DatabaseManagementTicketsRepository,
      databaseProvisioning as unknown as DatabaseProvisioningTicketsRepository,
      serverManagement as unknown as ServerManagementTicketsRepository,
      kubernetesManifest as unknown as KubernetesManifestTicketsRepository,
      target as unknown as KubectlCommandTicketsRepository,
    );
  });

  it('maps the dto to an OPEN entity and passes it to the matching repository', async () => {
    target.create.mockResolvedValue({ id: 1, number: 10 });

    await service.createKubectlCommandTicket(dto as never);

    expect(target.create).toHaveBeenCalledTimes(1);
    expect(target.create.mock.calls[0][0]).toMatchObject({
      ...dto,
      status: TicketStatus.OPEN,
      response: '',
    });
  });

  it('does not use any other repository', async () => {
    target.create.mockResolvedValue({});

    await service.createKubectlCommandTicket(dto as never);

    others.forEach((mock) => expect(mock.create).not.toHaveBeenCalled());
  });

  it('returns the repository result', async () => {
    const saved = { id: 1, number: 10 };
    target.create.mockResolvedValue(saved);

    await expect(
      service.createKubectlCommandTicket(dto as never),
    ).resolves.toBe(saved);
  });

  it('propagates the mapper error without calling the repository for a whitespace-only kubectlCommand', async () => {
    await expect(
      service.createKubectlCommandTicket({
        ...dto,
        kubectlCommand: '   ',
      } as never),
    ).rejects.toThrow('missing required field "kubectlCommand"');

    expect(target.create).not.toHaveBeenCalled();
  });

  it('propagates a repository rejection', async () => {
    const failure = new Error('database unavailable');
    target.create.mockRejectedValue(failure);

    await expect(service.createKubectlCommandTicket(dto as never)).rejects.toBe(
      failure,
    );
  });
});
