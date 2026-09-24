import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './common/database/database.module';
import { EnvModule } from './common/config/env.module';

@Module({
  imports: [EnvModule, DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
