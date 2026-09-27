import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { InfraHubApiAuthService } from './infra-hub-api-auth.service';
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
    private readonly infraHubApiAuthService: InfraHubApiAuthService,
  ) {}

  private get baseUrl(): string {
    return this.configService.get<string>('INFRA_HUB_API_URL')!;
  }

  async manageServerCommand(
    body: ManageCommandRequest,
  ): Promise<InfraHubApiResponse> {
    const accessToken = await this.infraHubApiAuthService.getAccessToken();
    const response = await firstValueFrom(
      this.httpService.post<InfraHubApiResponse>(
        `${this.baseUrl}/server-hub-api/manage-server`,
        body,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
    );
    return response.data;
  }

  async manageKubernetesManifest(
    body: ManageKubernetesManifestRequest,
  ): Promise<InfraHubApiResponse> {
    const accessToken = await this.infraHubApiAuthService.getAccessToken();
    const response = await firstValueFrom(
      this.httpService.post<InfraHubApiResponse>(
        `${this.baseUrl}/kubernates-hub-api/manage-manifest`,
        body,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
    );
    return response.data;
  }

  async executeKubectlCommand(
    body: ExecuteKubectlCommandRequest,
  ): Promise<InfraHubApiResponse> {
    const accessToken = await this.infraHubApiAuthService.getAccessToken();
    const response = await firstValueFrom(
      this.httpService.post<InfraHubApiResponse>(
        `${this.baseUrl}/kubernates-hub-api/execute-kubectl`,
        body,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
    );
    return response.data;
  }

  async manageDatabase(
    body: ManageDatabaseRequest,
  ): Promise<InfraHubApiResponse> {
    const accessToken = await this.infraHubApiAuthService.getAccessToken();
    const response = await firstValueFrom(
      this.httpService.post<InfraHubApiResponse>(
        `${this.baseUrl}/database-hub-api/manage-database`,
        body,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
    );
    return response.data;
  }

  async createDatabase(
    body: CreateDatabaseRequest,
  ): Promise<InfraHubApiResponse> {
    const accessToken = await this.infraHubApiAuthService.getAccessToken();
    const response = await firstValueFrom(
      this.httpService.post<InfraHubApiResponse>(
        `${this.baseUrl}/database-hub-api/create-database`,
        body,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      ),
    );
    return response.data;
  }

  async listDeployments(namespace: string): Promise<ListDeploymentsResponse> {
    const accessToken = await this.infraHubApiAuthService.getAccessToken();
    const response = await firstValueFrom(
      this.httpService.get<ListDeploymentsResponse>(
        `${this.baseUrl}/kubernates-hub-api/list-deployments`,
        {
          params: { namespace },
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      ),
    );
    return response.data;
  }

  async listDatabases(
    namespace: string,
    deployment: string,
  ): Promise<ListDatabasesResponse> {
    const accessToken = await this.infraHubApiAuthService.getAccessToken();
    const response = await firstValueFrom(
      this.httpService.get<ListDatabasesResponse>(
        `${this.baseUrl}/database-hub-api/list-databases`,
        {
          params: { namespace, deployment },
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      ),
    );
    return response.data;
  }
}
