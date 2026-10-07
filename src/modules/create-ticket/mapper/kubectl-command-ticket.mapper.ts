import { KubectlCommandTicketEntity } from '../../../common/database/kubectl-command-ticket/kubectl-command-ticket.entity';
import { TicketStatus } from '../../../common/database/ticket-status.enum';
import { ExecuteKubectlCommandRequest } from '../../infra-hub-api/infra-hub-api.types';
import { CreateKubectlCommandTicketDto } from '../dto/create-kubectl-command-ticket.dto';

export class KubectlCommandTicketMapper {
  static toEntity(
    dto: CreateKubectlCommandTicketDto,
  ): KubectlCommandTicketEntity {
    return KubectlCommandTicketEntity.builder()
      .withInformer(dto.informer ?? '')
      .withAssignee(dto.assignee)
      .withDepartment(dto.department)
      .withSubject(dto.subject)
      .withDescription(dto.description)
      .withStatus(TicketStatus.OPEN)
      .withKubectlCommand(dto.kubectlCommand)
      .withResponse('')
      .build();
  }

  static toExecuteKubectlCommandRequest(
    ticket: KubectlCommandTicketEntity,
  ): ExecuteKubectlCommandRequest {
    return {
      numberOfTickets: ticket.number,
      kubectlCommand: ticket.kubectlCommand,
    };
  }
}
