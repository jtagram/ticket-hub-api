import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { Role } from '../../common/roles/role.enum';
import { Roles } from '../../common/guards/roles.decorator';
import { SearchTicketService } from './search-ticket.service';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiFindAllDatabaseManagementTickets,
  ApiFindAllDatabaseProvisioningTickets,
  ApiFindAllServerManagementTickets,
  ApiFindAllKubernetesManifestTickets,
  ApiFindAllKubectlCommandTickets,
  ApiFindDatabaseManagementTicketByNumber,
  ApiFindDatabaseProvisioningTicketByNumber,
  ApiFindServerManagementTicketByNumber,
  ApiFindKubernetesManifestTicketByNumber,
  ApiFindKubectlCommandTicketByNumber,
} from './swagger/search-ticket.swagger';

@Controller('tickets')
@ApiTags('Search ticket')
export class SearchTicketController {
  constructor(private readonly searchTicketService: SearchTicketService) {}

  @ApiFindAllDatabaseManagementTickets()
  @Get('database/management')
  @Roles(Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER)
  findAllDatabaseManagementTickets() {
    return this.searchTicketService.findAllDatabaseManagementTickets();
  }

  @ApiFindAllDatabaseProvisioningTickets()
  @Get('database/provisioning')
  @Roles(Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER)
  findAllDatabaseProvisioningTickets() {
    return this.searchTicketService.findAllDatabaseProvisioningTickets();
  }

  @ApiFindAllServerManagementTickets()
  @Get('server/management')
  @Roles(Role.ADMIN, Role.SERVER, Role.SERVER_APPROVER)
  findAllServerManagementTickets() {
    return this.searchTicketService.findAllServerManagementTickets();
  }

  @ApiFindAllKubernetesManifestTickets()
  @Get('kubernetes/manifest')
  @Roles(Role.ADMIN, Role.KUBERNATES, Role.KUBERNATES_APPROVER)
  findAllKubernetesManifestTickets() {
    return this.searchTicketService.findAllKubernetesManifestTickets();
  }

  @ApiFindAllKubectlCommandTickets()
  @Get('kubernetes/kubectl')
  @Roles(Role.ADMIN, Role.KUBERNATES, Role.KUBERNATES_APPROVER)
  findAllKubectlCommandTickets() {
    return this.searchTicketService.findAllKubectlCommandTickets();
  }

  @ApiFindDatabaseManagementTicketByNumber()
  @Get('database/management/:number')
  @Roles(Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER)
  findDatabaseManagementTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findDatabaseManagementTicketByNumber(
      number,
    );
  }

  @ApiFindDatabaseProvisioningTicketByNumber()
  @Get('database/provisioning/:number')
  @Roles(Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER)
  findDatabaseProvisioningTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findDatabaseProvisioningTicketByNumber(
      number,
    );
  }

  @ApiFindServerManagementTicketByNumber()
  @Get('server/management/:number')
  @Roles(Role.ADMIN, Role.SERVER, Role.SERVER_APPROVER)
  findServerManagementTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findServerManagementTicketByNumber(
      number,
    );
  }

  @ApiFindKubernetesManifestTicketByNumber()
  @Get('kubernetes/manifest/:number')
  @Roles(Role.ADMIN, Role.KUBERNATES, Role.KUBERNATES_APPROVER)
  findKubernetesManifestTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findKubernetesManifestTicketByNumber(
      number,
    );
  }

  @ApiFindKubectlCommandTicketByNumber()
  @Get('kubernetes/kubectl/:number')
  @Roles(Role.ADMIN, Role.KUBERNATES, Role.KUBERNATES_APPROVER)
  findKubectlCommandTicketByNumber(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.searchTicketService.findKubectlCommandTicketByNumber(number);
  }
}
