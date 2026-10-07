import { ServerManagementTicketEntity } from '../../../common/database/server-management-ticket/server-management-ticket.entity';
import { TicketStatus } from '../../../common/database/ticket-status.enum';
import { ManageCommandRequest } from '../../infra-hub-api/infra-hub-api.types';
import { CreateServerManagementTicketDto } from '../dto/create-server-management-ticket.dto';

export class ServerManagementTicketMapper {
  static toEntity(
    dto: CreateServerManagementTicketDto,
  ): ServerManagementTicketEntity {
    return ServerManagementTicketEntity.builder()
      .withInformer(dto.informer ?? '')
      .withAssignee(dto.assignee)
      .withDepartment(dto.department)
      .withSubject(dto.subject)
      .withDescription(dto.description)
      .withStatus(TicketStatus.OPEN)
      .withCodeAnsible(dto.codeAnsible)
      .withResponse('')
      .build();
  }

  static toManageServerCommandRequest(
    ticket: ServerManagementTicketEntity,
  ): ManageCommandRequest {
    return {
      numberOfTickets: ticket.number,
      playbook: ticket.codeAnsible,
    };
  }
}
