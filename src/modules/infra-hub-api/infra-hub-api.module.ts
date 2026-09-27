import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InfraHubApiAuthService } from './infra-hub-api-auth.service';
import { InfraHubApiConnector } from './infra-hub-api.connector';
import { InfraHubApiService } from './infra-hub-api.service';

@Module({
  imports: [HttpModule],
  providers: [InfraHubApiAuthService, InfraHubApiConnector, InfraHubApiService],
  exports: [InfraHubApiService],
})
export class InfraHubApiModule {}
