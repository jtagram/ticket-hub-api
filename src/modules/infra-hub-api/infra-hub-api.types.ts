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
  command: string;
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
  dbName: string;
  sqlCode: string;
}
