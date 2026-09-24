import { Module } from '@nestjs/common';
import { SearchTicketController } from './search-ticket.controller';
import { SearchTicketService } from './search-ticket.service';

@Module({
  controllers: [SearchTicketController],
  providers: [SearchTicketService],
})
export class SearchTicketModule {}
