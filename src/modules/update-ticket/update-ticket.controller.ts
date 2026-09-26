import { Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { UpdateTicketService } from './update-ticket.service';

@Controller('tickets')
export class UpdateTicketController {
  constructor(private readonly updateTicketService: UpdateTicketService) {}

  @Patch('database/:number/approve')
  approveDatabaseTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.approveDatabaseTicket(number);
  }

  @Patch('database/provisioning/:number/approve')
  approveDatabaseProvisioningTicket(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.updateTicketService.approveDatabaseProvisioningTicket(number);
  }

  @Patch('datacenter/:number/approve')
  approveDatacenterTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.approveDatacenterTicket(number);
  }

  @Patch('kubernetes/manifest/:number/approve')
  approveKubernetesManifestTicket(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.updateTicketService.approveKubernetesManifestTicket(number);
  }

  @Patch('kubernetes/command/:number/approve')
  approveKubernetesCommandTicket(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.updateTicketService.approveKubernetesCommandTicket(number);
  }

  @Patch('database/:number/reject')
  rejectDatabaseTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.rejectDatabaseTicket(number);
  }

  @Patch('database/provisioning/:number/reject')
  rejectDatabaseProvisioningTicket(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.updateTicketService.rejectDatabaseProvisioningTicket(number);
  }

  @Patch('datacenter/:number/reject')
  rejectDatacenterTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.rejectDatacenterTicket(number);
  }

  @Patch('kubernetes/manifest/:number/reject')
  rejectKubernetesManifestTicket(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.updateTicketService.rejectKubernetesManifestTicket(number);
  }

  @Patch('kubernetes/command/:number/reject')
  rejectKubernetesCommandTicket(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.updateTicketService.rejectKubernetesCommandTicket(number);
  }
}
