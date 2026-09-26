import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { EnvModule } from './common/config/env.module';
import { FilterModule } from './common/filter/filter.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggerModule } from './instrument/logger/logger.module';
import { InfraHubApiModule } from './modules/infra-hub-api/infra-hub-api.module';
import { IamApiModule } from './modules/iam-api/iam-api.module';
import { SearchForValueListsModule } from './modules/search-for-value-lists/search-for-value-lists.module';
import { CreateTicketModule } from './modules/create-ticket/create-ticket.module';
import { SearchTicketModule } from './modules/search-ticket/search-ticket.module';
import { UpdateTicketModule } from './modules/update-ticket/update-ticket.module';

const jwtModule = JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    publicKey: configService.get<string>('JWT_PUBLIC_KEY'),
    verifyOptions: { algorithms: ['RS256'] },
  }),
});

@Module({
  imports: [
    EnvModule,
    LoggerModule,
    DatabaseModule,
    FilterModule,
    jwtModule,
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
