import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { EnvModule } from './common/config/env.module';
import { FilterModule } from './common/filter/filter.module';
import { LoggerModule } from './instrument/logger/logger.module';
import { InfraHubApiModule } from './modules/infra-hub-api/infra-hub-api.module';
import { IamApiModule } from './modules/iam-api/iam-api.module';
import { SearchForValueListsModule } from './modules/search-for-value-lists/search-for-value-lists.module';
import { CreateTicketModule } from './modules/create-ticket/create-ticket.module';
import { SearchTicketModule } from './modules/search-ticket/search-ticket.module';
import { UpdateTicketModule } from './modules/update-ticket/update-ticket.module';

@Module({
  imports: [
    EnvModule,
    LoggerModule,
    DatabaseModule,
    FilterModule,
    InfraHubApiModule,
    IamApiModule,
    SearchForValueListsModule,
    CreateTicketModule,
    SearchTicketModule,
    UpdateTicketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
