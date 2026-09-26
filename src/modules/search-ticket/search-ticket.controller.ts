import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SearchTicketService } from './search-ticket.service';

@Controller('tickets')
export class SearchTicketController {
  constructor(private readonly searchTicketService: SearchTicketService) {}

  @Get('database/management')
  findAllDatabaseManagementTickets() {
    return this.searchTicketService.findAllDatabaseManagementTickets();
  }

  @Get('database/provisioning')
  findAllDatabaseProvisioningTickets() {
    return this.searchTicketService.findAllDatabaseProvisioningTickets();
  }

  @Get('server/management')
  findAllServerManagementTickets() {
    return this.searchTicketService.findAllServerManagementTickets();
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

  @Get('database/provisioning/:number')
  findDatabaseProvisioningTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findDatabaseProvisioningTicketByNumber(
      number,
    );
  }

  @Get('server/management/:number')
  findServerManagementTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findServerManagementTicketByNumber(
      number,
    );
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
