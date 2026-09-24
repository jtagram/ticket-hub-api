import { Module } from '@nestjs/common';
import { InfraHubApiModule } from '../infra-hub-api/infra-hub-api.module';
import { CreateTicketController } from './create-ticket.controller';
import { CreateTicketService } from './create-ticket.service';

@Module({
  imports: [InfraHubApiModule],
  controllers: [CreateTicketController],
  providers: [CreateTicketService],
})
export class CreateTicketModule {}
