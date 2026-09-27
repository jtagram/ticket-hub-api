import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppUserAuthService } from './app-user-auth.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [AppUserAuthService],
  exports: [AppUserAuthService],
})
export class AppUserAuthModule {}
