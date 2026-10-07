import { DataSource } from 'typeorm';
import { DatabaseManagementTicketEntity } from '../../src/common/database/database-management-ticket/database-management-ticket.entity';
import { DatabaseProvisioningTicketEntity } from '../../src/common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { KubectlCommandTicketEntity } from '../../src/common/database/kubectl-command-ticket/kubectl-command-ticket.entity';
import { KubernetesManifestTicketEntity } from '../../src/common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { KubernetesTicketAction } from '../../src/common/database/kubernetes-ticket/kubernetes-ticket-action.enum';
import { ServerManagementTicketEntity } from '../../src/common/database/server-management-ticket/server-management-ticket.entity';
import { TicketStatus } from '../../src/common/database/ticket-status.enum';

type Overrides<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

const COMMON_FIELDS = {
  informer: 'informer@example.com',
  assignee: 'assignee@example.com',
  department: 'INFRA',
  subject: 'Seeded ticket',
  description: 'Seeded directly in the database by the test',
  status: TicketStatus.OPEN,
  response: '',
};

/** Inserts a database-management ticket straight into pg-mem. */
export function seedDatabaseManagementTicket(
  dataSource: DataSource,
  overrides: Overrides<DatabaseManagementTicketEntity> = {},
): Promise<DatabaseManagementTicketEntity> {
  return dataSource.getRepository(DatabaseManagementTicketEntity).save(
    Object.assign(new DatabaseManagementTicketEntity(), {
      ...COMMON_FIELDS,
      dbNamespace: 'prod',
      dbDeployment: 'postgres-main',
      dbName: 'orders',
      sqlCode: 'CREATE INDEX idx_orders_created_at ON orders (created_at);',
      ...overrides,
    }),
  );
}

/** Inserts a database-provisioning ticket straight into pg-mem. */
export function seedDatabaseProvisioningTicket(
  dataSource: DataSource,
  overrides: Overrides<DatabaseProvisioningTicketEntity> = {},
): Promise<DatabaseProvisioningTicketEntity> {
  return dataSource.getRepository(DatabaseProvisioningTicketEntity).save(
    Object.assign(new DatabaseProvisioningTicketEntity(), {
      ...COMMON_FIELDS,
      dbNamespace: 'prod',
      dbDeployment: 'postgres-main',
      newDbName: 'billing',
      ...overrides,
    }),
  );
}

/** Inserts a server-management ticket straight into pg-mem. */
export function seedServerManagementTicket(
  dataSource: DataSource,
  overrides: Overrides<ServerManagementTicketEntity> = {},
): Promise<ServerManagementTicketEntity> {
  return dataSource.getRepository(ServerManagementTicketEntity).save(
    Object.assign(new ServerManagementTicketEntity(), {
      ...COMMON_FIELDS,
      codeAnsible: '- hosts: all\n  tasks:\n    - ping:',
      ...overrides,
    }),
  );
}

/** Inserts a kubernetes-manifest ticket straight into pg-mem. */
export function seedKubernetesManifestTicket(
  dataSource: DataSource,
  overrides: Overrides<KubernetesManifestTicketEntity> = {},
): Promise<KubernetesManifestTicketEntity> {
  return dataSource.getRepository(KubernetesManifestTicketEntity).save(
    Object.assign(new KubernetesManifestTicketEntity(), {
      ...COMMON_FIELDS,
      namespace: 'apps',
      action: KubernetesTicketAction.APPLY,
      codeYaml: 'apiVersion: v1\nkind: ConfigMap',
      ...overrides,
    }),
  );
}

/** Inserts a kubectl-command ticket straight into pg-mem. */
export function seedKubectlCommandTicket(
  dataSource: DataSource,
  overrides: Overrides<KubectlCommandTicketEntity> = {},
): Promise<KubectlCommandTicketEntity> {
  return dataSource.getRepository(KubectlCommandTicketEntity).save(
    Object.assign(new KubectlCommandTicketEntity(), {
      ...COMMON_FIELDS,
      kubectlCommand: 'kubectl get pods -n apps',
      ...overrides,
    }),
  );
}
