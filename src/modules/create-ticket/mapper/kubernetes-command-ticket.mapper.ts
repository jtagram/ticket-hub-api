import { KubernetesCommandTicketEntity } from '../../../common/database/kubernetes-command-ticket/kubernetes-command-ticket.entity';
import { TicketStatus } from '../../../common/database/ticket-status.enum';
import { ManageCommandRequest } from '../../infra-hub-api/infra-hub-api.types';
import { CreateKubernetesCommandTicketDto } from '../dto/create-kubernetes-command-ticket.dto';

export class KubernetesCommandTicketMapper {
  static toEntity(
    dto: CreateKubernetesCommandTicketDto,
  ): KubernetesCommandTicketEntity {
    return KubernetesCommandTicketEntity.builder()
      .withInformer(dto.informer)
      .withAssignee(dto.assignee)
      .withDepartment(dto.department)
      .withSubject(dto.subject)
      .withDescription(dto.description)
      .withStatus(TicketStatus.OPEN)
      .withCodeYaml(dto.codeYaml)
      .withResponse('')
      .build();
  }

  static toManageKubernetesCommandRequest(
    ticket: KubernetesCommandTicketEntity,
  ): ManageCommandRequest {
    return {
      numberOfTickets: ticket.number,
      command: ticket.codeYaml,
    };
  }
}
