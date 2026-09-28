export interface InfraHubApiExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | string | null;
  errorMessage?: string;
  errorCode?: string | number | null;
}

export interface InfraHubApiResponse {
  executionResult: InfraHubApiExecutionResult;
  logId: string;
}

export interface ManageCommandRequest {
  numberOfTickets: number;
  playbook: string;
}

export interface ExecuteKubectlCommandRequest {
  numberOfTickets: number;
  kubectlCommand: string;
}

export type KubernetesManifestAction = 'apply' | 'delete' | 'create';

export interface ManageKubernetesManifestRequest {
  numberOfTickets: number;
  namespace: string;
  action: KubernetesManifestAction;
  manifest: string;
}

export interface ManageDatabaseRequest {
  numberOfTickets: number;
  namespace: string;
  deployment: string;
  dbName: string;
  sqlCode: string;
}

export interface CreateDatabaseRequest {
  numberOfTickets: number;
  namespace: string;
  deployment: string;
  dbName: string;
}

export interface ListDeploymentsResponse {
  deployments: string[];
}

export interface ListDatabasesResponse {
  databases: string[];
}
