import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SearchTicketService } from './search-ticket.service';

@Controller('tickets')
export class SearchTicketController {
  constructor(private readonly searchTicketService: SearchTicketService) {}

  @Get('database/management')
  findAllDatabaseManagementTickets() {
    return this.searchTicketService.findAllDatabaseManagementTickets();
  }

  @Get('datacenter')
  findAllDatacenterTickets() {
    return this.searchTicketService.findAllDatacenterTickets();
  }

  @Get('kubernetes/manifest')
  findAllKubernetesManifestTickets() {
    return this.searchTicketService.findAllKubernetesManifestTickets();
  }

  @Get('kubernetes/command')
  findAllKubernetesCommandTickets() {
    return this.searchTicketService.findAllKubernetesCommandTickets();
  }

  @Get('database/management/:number')
  findDatabaseManagementTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findDatabaseManagementTicketByNumber(
      number,
    );
  }

  @Get('datacenter/:number')
  findDatacenterTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findDatacenterTicketByNumber(number);
  }

  @Get('kubernetes/manifest/:number')
  findKubernetesManifestTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findKubernetesManifestTicketByNumber(
      number,
    );
  }

  @Get('kubernetes/command/:number')
  findKubernetesCommandTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findKubernetesCommandTicketByNumber(
      number,
    );
  }
}
