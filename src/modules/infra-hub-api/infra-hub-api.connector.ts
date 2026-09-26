import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  CreateDatabaseRequest,
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
  ) {}

  private get baseUrl(): string {
    return this.configService.get<string>('INFRA_HUB_API_URL')!;
  }

  async manageServerCommand(
    body: ManageCommandRequest,
  ): Promise<InfraHubApiResponse> {
    const response = await firstValueFrom(
      this.httpService.post<InfraHubApiResponse>(
        `${this.baseUrl}/server-hub-api/manage-server`,
        body,
      ),
    );
    return response.data;
  }

  async manageKubernetesManifest(
    body: ManageKubernetesManifestRequest,
  ): Promise<InfraHubApiResponse> {
    const response = await firstValueFrom(
      this.httpService.post<InfraHubApiResponse>(
        `${this.baseUrl}/kubernates-hub-api/manage-manifest`,
        body,
      ),
    );
    return response.data;
  }

  async manageKubernetesCommand(
    body: ManageCommandRequest,
  ): Promise<InfraHubApiResponse> {
    const response = await firstValueFrom(
      this.httpService.post<InfraHubApiResponse>(
        `${this.baseUrl}/kubernates-hub-api/manage-server`,
        body,
      ),
    );
    return response.data;
  }

  async manageDatabase(
    body: ManageDatabaseRequest,
  ): Promise<InfraHubApiResponse> {
    const response = await firstValueFrom(
      this.httpService.post<InfraHubApiResponse>(
        `${this.baseUrl}/database-hub-api/manage-database`,
        body,
      ),
    );
    return response.data;
  }

  async createDatabase(
    body: CreateDatabaseRequest,
  ): Promise<InfraHubApiResponse> {
    const response = await firstValueFrom(
      this.httpService.post<InfraHubApiResponse>(
        `${this.baseUrl}/database-hub-api/create-database`,
        body,
      ),
    );
    return response.data;
  }

  async listDeployments(namespace: string): Promise<ListDeploymentsResponse> {
    const response = await firstValueFrom(
      this.httpService.get<ListDeploymentsResponse>(
        `${this.baseUrl}/kubernates-hub-api/list-deployments`,
        { params: { namespace } },
      ),
    );
    return response.data;
  }

  async listDatabases(
    namespace: string,
    deployment: string,
  ): Promise<ListDatabasesResponse> {
    const response = await firstValueFrom(
      this.httpService.get<ListDatabasesResponse>(
        `${this.baseUrl}/database-hub-api/list-databases`,
        { params: { namespace, deployment } },
      ),
    );
    return response.data;
  }
}
