import { Module } from '@nestjs/common';
import { InfraHubApiModule } from '../infra-hub-api/infra-hub-api.module';
import { UpdateTicketController } from './update-ticket.controller';
import { UpdateTicketService } from './update-ticket.service';

@Module({
  imports: [InfraHubApiModule],
  controllers: [UpdateTicketController],
  providers: [UpdateTicketService],
})
export class UpdateTicketModule {}
