import { Module } from '@nestjs/common';
import { IamApiModule } from '../iam-api/iam-api.module';
import { InfraHubApiModule } from '../infra-hub-api/infra-hub-api.module';
import { SearchForValueListsController } from './search-for-value-lists.controller';
import { SearchForValueListsService } from './search-for-value-lists.service';

@Module({
  imports: [IamApiModule, InfraHubApiModule],
  controllers: [SearchForValueListsController],
  providers: [SearchForValueListsService],
})
export class SearchForValueListsModule {}
