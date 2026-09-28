import { HttpException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import { AppUserAuthService } from '../../common/iam-api-auth/app-user-auth.service';
import {
  CreateDatabaseRequest,
  ExecuteKubectlCommandRequest,
  InfraHubApiResponse,
  ListDatabasesResponse,
  ListDeploymentsResponse,
  ManageCommandRequest,
  ManageDatabaseRequest,
  ManageKubernetesManifestRequest,
} from './infra-hub-api.types';

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
  private async request<T>(call: () => Promise<{ data: T }>): Promise<T> {
    try {
      const response = await call();
      return response.data;
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw error;
    }
  }

  async manageServerCommand(
    body: ManageCommandRequest,
  ): Promise<InfraHubApiResponse> {
    const accessToken = await this.appUserAuthService.getAccessToken(
      this.configService.get<string>('INFRA_HUB_API_APPLICATION_NAME')!,
    );
    return this.request(() =>
      firstValueFrom(
        this.httpService.post<InfraHubApiResponse>(
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
        this.httpService.post<InfraHubApiResponse>(
          `${this.baseUrl}/kubernates-hub-api/manage-manifest`,
          body,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        ),
      ),
    );
  }

  async executeKubectlCommand(
    body: ExecuteKubectlCommandRequest,
  ): Promise<InfraHubApiResponse> {
    const accessToken = await this.appUserAuthService.getAccessToken(
      this.configService.get<string>('INFRA_HUB_API_APPLICATION_NAME')!,
    );
    return this.request(() =>
      firstValueFrom(
        this.httpService.post<InfraHubApiResponse>(
          `${this.baseUrl}/kubernates-hub-api/execute-kubectl`,
          body,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        ),
      ),
    );
  }

  async manageDatabase(
    body: ManageDatabaseRequest,
  ): Promise<InfraHubApiResponse> {
    const accessToken = await this.appUserAuthService.getAccessToken(
      this.configService.get<string>('INFRA_HUB_API_APPLICATION_NAME')!,
    );
    return this.request(() =>
      firstValueFrom(
        this.httpService.post<InfraHubApiResponse>(
          `${this.baseUrl}/database-hub-api/manage-database`,
          body,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        ),
      ),
    );
  }

  async createDatabase(
    body: CreateDatabaseRequest,
  ): Promise<InfraHubApiResponse> {
    const accessToken = await this.appUserAuthService.getAccessToken(
      this.configService.get<string>('INFRA_HUB_API_APPLICATION_NAME')!,
    );
    return this.request(() =>
      firstValueFrom(
        this.httpService.post<InfraHubApiResponse>(
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
        this.httpService.get<ListDeploymentsResponse>(
          `${this.baseUrl}/kubernates-hub-api/list-deployments`,
          {
            params: { namespace },
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        ),
      ),
    );
  }

  async listDatabases(
    namespace: string,
    deployment: string,
  ): Promise<ListDatabasesResponse> {
    const accessToken = await this.appUserAuthService.getAccessToken(
      this.configService.get<string>('INFRA_HUB_API_APPLICATION_NAME')!,
    );
    return this.request(() =>
      firstValueFrom(
        this.httpService.get<ListDatabasesResponse>(
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
