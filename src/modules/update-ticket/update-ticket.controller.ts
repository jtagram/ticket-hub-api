import { Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { UpdateTicketService } from './update-ticket.service';

@Controller('tickets')
export class UpdateTicketController {
  constructor(private readonly updateTicketService: UpdateTicketService) {}

  @Patch('database/:number/approve')
  approveDatabaseTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.approveDatabaseTicket(number);
  }

  @Patch('datacenter/:number/approve')
  approveDatacenterTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.approveDatacenterTicket(number);
  }

  @Patch('kubernetes/:number/approve')
  approveKubernetesTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.approveKubernetesTicket(number);
  }

  @Patch('database/:number/reject')
  rejectDatabaseTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.rejectDatabaseTicket(number);
  }

  @Patch('datacenter/:number/reject')
  rejectDatacenterTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.rejectDatacenterTicket(number);
  }

  @Patch('kubernetes/:number/reject')
  rejectKubernetesTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.rejectKubernetesTicket(number);
  }
}
