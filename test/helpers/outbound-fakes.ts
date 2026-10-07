import { jest } from '@jest/globals';

export type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;

function asyncMock(): AsyncMock {
  return jest.fn<(...args: unknown[]) => Promise<unknown>>();
}

/**
 * Fake of InfraHubApiConnector, the single outbound HTTP edge towards
 * infra-hub-api. Provide it through `overrides` in createTicketTestApp.
 */
export function createInfraHubConnectorFake() {
  return {
    manageServerCommand: asyncMock(),
    manageKubernetesManifest: asyncMock(),
    executeKubectlCommand: asyncMock(),
    manageDatabase: asyncMock(),
    createDatabase: asyncMock(),
    listDeployments: asyncMock(),
    listDatabases: asyncMock(),
  };
}

/** Fake of IamApiConnector, the outbound HTTP edge towards iam-api. */
export function createIamConnectorFake() {
  return {
    findInternalUsersByRole: asyncMock(),
  };
}

/** Clears calls and implementations of every method of a fake. */
export function resetFake(fake: Record<string, AsyncMock>): void {
  Object.values(fake).forEach((method) => method.mockReset());
}

/** Number of calls received by the methods of a fake, keyed by method name. */
export function callCounts(fake: Record<string, AsyncMock>) {
  return Object.fromEntries(
    Object.entries(fake).map(([name, method]) => [
      name,
      method.mock.calls.length,
    ]),
  );
}

/** A successful infra-hub-api execution payload. */
export function infraHubSuccess(stdout = 'done') {
  return {
    executionResult: {
      success: true,
      stdout,
      stderr: '',
      exitCode: 0,
    },
    logId: 'log-1',
  };
}

/** infra-hub-api answered 200 but the execution itself failed (`success: false`). */
export function infraHubFailure(stderr = 'permission denied') {
  return {
    executionResult: {
      success: false,
      stdout: '',
      stderr,
      exitCode: 1,
      errorMessage: 'execution failed',
    },
    logId: 'log-2',
  };
}
