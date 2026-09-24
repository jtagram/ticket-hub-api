import { DatacenterTicketEntity } from '../../../common/database/datacenter-ticket/datacenter-ticket.entity';
import { TicketStatus } from '../../../common/database/ticket-status.enum';
import { ManageCommandRequest } from '../../infra-hub-api/infra-hub-api.types';
import { CreateDatacenterTicketDto } from '../dto/create-datacenter-ticket.dto';

export class DatacenterTicketMapper {
  static toEntity(dto: CreateDatacenterTicketDto): DatacenterTicketEntity {
    return DatacenterTicketEntity.builder()
      .withInformer(dto.informer)
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
    ticket: DatacenterTicketEntity,
  ): ManageCommandRequest {
    return {
      numberOfTickets: ticket.number,
      command: ticket.codeAnsible,
    };
  }
}
