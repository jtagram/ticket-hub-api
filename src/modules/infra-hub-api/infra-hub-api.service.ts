import { Injectable } from '@nestjs/common';
import { InfraHubApiConnector } from './infra-hub-api.connector';
import {
  InfraHubApiResponse,
  ManageCommandRequest,
  ManageDatabaseRequest,
  ManageKubernetesManifestRequest,
} from './infra-hub-api.types';

@Injectable()
export class InfraHubApiService {
  constructor(private readonly infraHubApiConnector: InfraHubApiConnector) {}

  async manageServerCommand(
    request: ManageCommandRequest,
  ): Promise<InfraHubApiResponse> {
    return this.infraHubApiConnector.manageServerCommand(request);
  }

  async manageKubernetesManifest(
    request: ManageKubernetesManifestRequest,
  ): Promise<InfraHubApiResponse> {
    return this.infraHubApiConnector.manageKubernetesManifest(request);
  }

  async manageKubernetesCommand(
    request: ManageCommandRequest,
  ): Promise<InfraHubApiResponse> {
    return this.infraHubApiConnector.manageKubernetesCommand(request);
  }

  async manageDatabase(
    request: ManageDatabaseRequest,
  ): Promise<InfraHubApiResponse> {
    return this.infraHubApiConnector.manageDatabase(request);
  }
}
