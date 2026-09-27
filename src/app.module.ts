import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { EnvModule } from './common/config/env.module';
import { FilterModule } from './common/filter/filter.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtPublicKeyModule } from './common/jwt/jwt-public-key.module';
import { AppUserAuthModule } from './common/iam-api-auth/app-user-auth.module';
import { LoggerModule } from './instrument/logger/logger.module';
import { InfraHubApiModule } from './modules/infra-hub-api/infra-hub-api.module';
import { IamApiModule } from './modules/iam-api/iam-api.module';
import { SearchForValueListsModule } from './modules/search-for-value-lists/search-for-value-lists.module';
import { CreateTicketModule } from './modules/create-ticket/create-ticket.module';
import { SearchTicketModule } from './modules/search-ticket/search-ticket.module';
import { UpdateTicketModule } from './modules/update-ticket/update-ticket.module';

const jwtModule = JwtModule.register({});

@Module({
  imports: [
    EnvModule,
    LoggerModule,
    ScheduleModule.forRoot(),
    DatabaseModule,
    FilterModule,
    jwtModule,
    JwtPublicKeyModule,
    AppUserAuthModule,
    InfraHubApiModule,
    IamApiModule,
    SearchForValueListsModule,
    CreateTicketModule,
    SearchTicketModule,
    UpdateTicketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
