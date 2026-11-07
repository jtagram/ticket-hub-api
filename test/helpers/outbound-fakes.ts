import { jest } from '@jest/globals';
import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { AxiosError } from 'axios';
import { from } from 'rxjs';

export type AsyncMock = jest.Mock<(...args: unknown[]) => Promise<unknown>>;

function asyncMock(): AsyncMock {
	return jest.fn<(...args: unknown[]) => Promise<unknown>>();
}

/**
 * Programmable stand-in for infra-hub-api, one mock per operation (named like
 * the InfraHubApiConnector methods). It is NOT injected as the connector: wire
 * it with {@link infraHubOverrides}, which replaces the HTTP client so the real
 * InfraHubApiConnector runs against infra-hub-api's `{ ok, msg, data }` wire
 * format:
 * - a mock that resolves a payload is answered as `200 { ok: true, data: payload }`;
 * - a mock that rejects with an HttpException is answered as the same status
 *   with `{ ok: false, msg, data: null }`;
 * - any other rejection is a failure without an HTTP response (network error).
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
		Object.entries(fake).map(([name, method]) => [name, method.mock.calls.length]),
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

/** infra-hub-api success envelope around `data`. */
export function infraHubEnvelope<T>(data: T, msg = 'ok') {
	return { ok: true, msg, data };
}

/** infra-hub-api error envelope. */
export function infraHubErrorEnvelope(msg: string) {
	return { ok: false, msg, data: null };
}

type InfraHubFake = ReturnType<typeof createInfraHubConnectorFake>;

function messageOfHttpException(exception: HttpException): string {
	const body = exception.getResponse();
	const message = typeof body === 'string' ? body : (body as { message?: unknown }).message;
	return typeof message === 'string' ? message : exception.message;
}

async function respondLikeInfraHubApi(call: () => Promise<unknown>) {
	try {
		return { data: infraHubEnvelope(await call()) };
	} catch (error) {
		if (error instanceof HttpException) {
			throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
				status: error.getStatus(),
				data: infraHubErrorEnvelope(messageOfHttpException(error)),
			} as never);
		}
		throw error;
	}
}

/**
 * Fake HttpService that routes each infra-hub-api URL to the matching mock of
 * `fake` and answers with the infra-hub-api envelope.
 */
export function createInfraHubHttpService(fake: InfraHubFake): HttpService {
	const postRoutes: Record<string, (body: never) => Promise<unknown>> = {
		'/server-hub-api/manage-server': (body) => fake.manageServerCommand(body),
		'/kubernates-hub-api/manage-manifest': (body) => fake.manageKubernetesManifest(body),
		'/kubernates-hub-api/execute-kubectl': (body) => fake.executeKubectlCommand(body),
		'/database-hub-api/manage-database': (body) => fake.manageDatabase(body),
		'/database-hub-api/create-database': (body) => fake.createDatabase(body),
	};
	const routeOf = (url: string) => '/' + url.split('/').slice(-2).join('/');

	return {
		post: (url: string, body: never) =>
			from(respondLikeInfraHubApi(() => postRoutes[routeOf(url)](body))),
		get: (url: string, config: { params: Record<string, string> }) =>
			from(
				respondLikeInfraHubApi(() =>
					routeOf(url) === '/kubernates-hub-api/list-deployments'
						? fake.listDeployments(config.params.namespace)
						: fake.listDatabases(config.params.namespace, config.params.deployment),
				),
			),
	} as unknown as HttpService;
}

/** Overrides for createTicketTestApp that put `fake` behind the real InfraHubApiConnector. */
export function infraHubOverrides(fake: InfraHubFake) {
	return [{ provide: HttpService, useValue: createInfraHubHttpService(fake) }];
}
