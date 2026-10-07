import { Controller, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { Role } from '../../common/roles/role.enum';
import { Roles } from '../../common/guards/roles.decorator';
import { UpdateTicketService } from './update-ticket.service';

@Controller('tickets')
export class UpdateTicketController {
  constructor(private readonly updateTicketService: UpdateTicketService) {}

  @Patch('database/management/:number/approve')
  @Roles(Role.ADMIN, Role.DATABASE_APPROVER)
  approveDatabaseManagementTicket(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.updateTicketService.approveDatabaseManagementTicket(number);
  }

  @Patch('database/provisioning/:number/approve')
  @Roles(Role.ADMIN, Role.DATABASE_APPROVER)
  approveDatabaseProvisioningTicket(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.updateTicketService.approveDatabaseProvisioningTicket(number);
  }

  @Patch('server/management/:number/approve')
  @Roles(Role.ADMIN, Role.SERVER_APPROVER)
  approveServerManagementTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.approveServerManagementTicket(number);
  }

  @Patch('kubernetes/manifest/:number/approve')
  @Roles(Role.ADMIN, Role.KUBERNATES_APPROVER)
  approveKubernetesManifestTicket(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.updateTicketService.approveKubernetesManifestTicket(number);
  }

  @Patch('kubernetes/kubectl/:number/approve')
  @Roles(Role.ADMIN, Role.KUBERNATES_APPROVER)
  approveKubectlCommandTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.approveKubectlCommandTicket(number);
  }

  @Patch('database/management/:number/reject')
  @Roles(Role.ADMIN, Role.DATABASE_APPROVER)
  rejectDatabaseManagementTicket(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.updateTicketService.rejectDatabaseManagementTicket(number);
  }

  @Patch('database/provisioning/:number/reject')
  @Roles(Role.ADMIN, Role.DATABASE_APPROVER)
  rejectDatabaseProvisioningTicket(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.updateTicketService.rejectDatabaseProvisioningTicket(number);
  }

  @Patch('server/management/:number/reject')
  @Roles(Role.ADMIN, Role.SERVER_APPROVER)
  rejectServerManagementTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.rejectServerManagementTicket(number);
  }

  @Patch('kubernetes/manifest/:number/reject')
  @Roles(Role.ADMIN, Role.KUBERNATES_APPROVER)
  rejectKubernetesManifestTicket(
    @Param('number', ParseIntPipe) number: number,
  ) {
    return this.updateTicketService.rejectKubernetesManifestTicket(number);
  }

  @Patch('kubernetes/kubectl/:number/reject')
  @Roles(Role.ADMIN, Role.KUBERNATES_APPROVER)
  rejectKubectlCommandTicket(@Param('number', ParseIntPipe) number: number) {
    return this.updateTicketService.rejectKubectlCommandTicket(number);
  }
}
