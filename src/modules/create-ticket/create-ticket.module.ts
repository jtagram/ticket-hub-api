import { Module } from '@nestjs/common';
import { CreateTicketController } from './create-ticket.controller';
import { CreateTicketService } from './create-ticket.service';

@Module({
  controllers: [CreateTicketController],
  providers: [CreateTicketService],
})
export class CreateTicketModule {}
