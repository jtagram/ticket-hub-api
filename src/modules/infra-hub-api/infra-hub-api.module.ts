import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InfraHubApiConnector } from './infra-hub-api.connector';
import { InfraHubApiService } from './infra-hub-api.service';

@Module({
  imports: [HttpModule],
  providers: [InfraHubApiConnector, InfraHubApiService],
  exports: [InfraHubApiService],
})
export class InfraHubApiModule {}
