import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IamApiConnector } from './iam-api.connector';
import { IamApiService } from './iam-api.service';

@Module({
  imports: [HttpModule],
  providers: [IamApiConnector, IamApiService],
  exports: [IamApiService],
})
export class IamApiModule {}
