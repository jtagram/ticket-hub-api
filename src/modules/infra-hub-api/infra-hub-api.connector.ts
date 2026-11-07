import { BadGatewayException, HttpException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AppUserAuthService } from '../../common/iam-api-auth/app-user-auth.service';
import {
	CreateDatabaseRequest,
	ExecuteKubectlCommandRequest,
	InfraHubApiEnvelope,
	InfraHubApiResponse,
	ListDatabasesResponse,
	ListDeploymentsResponse,
	ManageCommandRequest,
	ManageDatabaseRequest,
	ManageKubernetesManifestRequest,
} from './infra-hub-api.types';

const INVALID_ENVELOPE_MESSAGE = 'infra-hub-api answered with an unexpected response';
const UNKNOWN_ERROR_MESSAGE = 'infra-hub-api request failed';

function errorMessageOf(body: unknown): string {
	const msg = (body as { msg?: unknown } | null | undefined)?.msg;
	return typeof msg === 'string' && msg.length > 0 ? msg : UNKNOWN_ERROR_MESSAGE;
}

@Injectable()
export class InfraHubApiConnector {
	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService,
		private readonly appUserAuthService: AppUserAuthService,
	) {}

	private get baseUrl(): string {
		return this.configService.get<string>('INFRA_HUB_API_URL')!;
	}

	// firstValueFrom() rejects with a raw AxiosError on any non-2xx response.
	// That's neither an HttpException nor a TypeORMError, so it used to slip
	// past every specific exception filter and surface as a generic
	// "unexpected error", hiding infra-hub-api's real status and message.
	// infra-hub-api errors are `{ ok: false, msg, data: null }`: the status is
	// kept and `msg` becomes the message of the HttpException.
	private async request<T>(call: () => Promise<{ data: InfraHubApiEnvelope<T> }>): Promise<T> {
		let envelope: InfraHubApiEnvelope<T> | undefined;
		try {
			envelope = (await call()).data;
		} catch (error) {
			if (isAxiosError(error) && error.response) {
				throw new HttpException(errorMessageOf(error.response.data), error.response.status);
			}
			throw error;
		}

		if (!envelope?.ok) {
			throw new BadGatewayException(envelope?.msg || INVALID_ENVELOPE_MESSAGE);
		}
		if (envelope.data === null || envelope.data === undefined) {
			throw new BadGatewayException(INVALID_ENVELOPE_MESSAGE);
		}
		return envelope.data;
	}

	async manageServerCommand(body: ManageCommandRequest): Promise<InfraHubApiResponse> {
		const accessToken = await this.appUserAuthService.getAccessToken(
			this.configService.get<string>('INFRA_HUB_API_APPLICATION_NAME')!,
		);
		return this.request(() =>
			firstValueFrom(
				this.httpService.post<InfraHubApiEnvelope<InfraHubApiResponse>>(
					`${this.baseUrl}/server-hub-api/manage-server`,
					body,
					{ headers: { Authorization: `Bearer ${accessToken}` } },
				),
			),
		);
	}

	async manageKubernetesManifest(
		body: ManageKubernetesManifestRequest,
	): Promise<InfraHubApiResponse> {
		const accessToken = await this.appUserAuthService.getAccessToken(
			this.configService.get<string>('INFRA_HUB_API_APPLICATION_NAME')!,
		);
		return this.request(() =>
			firstValueFrom(
				this.httpService.post<InfraHubApiEnvelope<InfraHubApiResponse>>(
					`${this.baseUrl}/kubernates-hub-api/manage-manifest`,
					body,
					{ headers: { Authorization: `Bearer ${accessToken}` } },
				),
			),
		);
	}

	async executeKubectlCommand(body: ExecuteKubectlCommandRequest): Promise<InfraHubApiResponse> {
		const accessToken = await this.appUserAuthService.getAccessToken(
			this.configService.get<string>('INFRA_HUB_API_APPLICATION_NAME')!,
		);
		return this.request(() =>
			firstValueFrom(
				this.httpService.post<InfraHubApiEnvelope<InfraHubApiResponse>>(
					`${this.baseUrl}/kubernates-hub-api/execute-kubectl`,
					body,
					{ headers: { Authorization: `Bearer ${accessToken}` } },
				),
			),
		);
	}

	async manageDatabase(body: ManageDatabaseRequest): Promise<InfraHubApiResponse> {
		const accessToken = await this.appUserAuthService.getAccessToken(
			this.configService.get<string>('INFRA_HUB_API_APPLICATION_NAME')!,
		);
		return this.request(() =>
			firstValueFrom(
				this.httpService.post<InfraHubApiEnvelope<InfraHubApiResponse>>(
					`${this.baseUrl}/database-hub-api/manage-database`,
					body,
					{ headers: { Authorization: `Bearer ${accessToken}` } },
				),
			),
		);
	}

	async createDatabase(body: CreateDatabaseRequest): Promise<InfraHubApiResponse> {
		const accessToken = await this.appUserAuthService.getAccessToken(
			this.configService.get<string>('INFRA_HUB_API_APPLICATION_NAME')!,
		);
		return this.request(() =>
			firstValueFrom(
				this.httpService.post<InfraHubApiEnvelope<InfraHubApiResponse>>(
					`${this.baseUrl}/database-hub-api/create-database`,
					body,
					{ headers: { Authorization: `Bearer ${accessToken}` } },
				),
			),
		);
	}

	async listDeployments(namespace: string): Promise<ListDeploymentsResponse> {
		const accessToken = await this.appUserAuthService.getAccessToken(
			this.configService.get<string>('INFRA_HUB_API_APPLICATION_NAME')!,
		);
		return this.request(() =>
			firstValueFrom(
				this.httpService.get<InfraHubApiEnvelope<ListDeploymentsResponse>>(
					`${this.baseUrl}/kubernates-hub-api/list-deployments`,
					{
						params: { namespace },
						headers: { Authorization: `Bearer ${accessToken}` },
					},
				),
			),
		);
	}

	async listDatabases(namespace: string, deployment: string): Promise<ListDatabasesResponse> {
		const accessToken = await this.appUserAuthService.getAccessToken(
			this.configService.get<string>('INFRA_HUB_API_APPLICATION_NAME')!,
		);
		return this.request(() =>
			firstValueFrom(
				this.httpService.get<InfraHubApiEnvelope<ListDatabasesResponse>>(
					`${this.baseUrl}/database-hub-api/list-databases`,
					{
						params: { namespace, deployment },
						headers: { Authorization: `Bearer ${accessToken}` },
					},
				),
			),
		);
	}
}
