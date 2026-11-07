export interface InfraHubApiExecutionResult {
	success: boolean;
	stdout: string;
	stderr: string;
	exitCode: number | string | null;
	errorMessage?: string;
	errorCode?: string | number | null;
}

/**
 * Envelope that wraps every infra-hub-api response (except `GET /health`).
 * A failed playbook is still `ok: true`: it is reported in
 * `data.executionResult.success`.
 */
export type InfraHubApiEnvelope<T> =
	{ ok: true; msg: string; data: T } | { ok: false; msg: string; data: null };

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
