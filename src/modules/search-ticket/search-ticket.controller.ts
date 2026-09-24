import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SearchTicketService } from './search-ticket.service';

@Controller('tickets')
export class SearchTicketController {
  constructor(private readonly searchTicketService: SearchTicketService) {}

  @Get('database')
  findAllDatabaseTickets() {
    return this.searchTicketService.findAllDatabaseTickets();
  }

  @Get('datacenter')
  findAllDatacenterTickets() {
    return this.searchTicketService.findAllDatacenterTickets();
  }

  @Get('kubernetes')
  findAllKubernetesTickets() {
    return this.searchTicketService.findAllKubernetesTickets();
  }

  @Get('database/:number')
  findDatabaseTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findDatabaseTicketByNumber(number);
  }

  @Get('datacenter/:number')
  findDatacenterTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findDatacenterTicketByNumber(number);
  }

  @Get('kubernetes/:number')
  findKubernetesTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findKubernetesTicketByNumber(number);
  }
}
