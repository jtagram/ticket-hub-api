import { KubernetesManifestTicketEntity } from '../../../common/database/kubernetes-manifest-ticket/kubernetes-manifest-ticket.entity';
import { TicketStatus } from '../../../common/database/ticket-status.enum';
import {
  KubernetesManifestAction,
  ManageKubernetesManifestRequest,
} from '../../infra-hub-api/infra-hub-api.types';
import { CreateKubernetesManifestTicketDto } from '../dto/create-kubernetes-manifest-ticket.dto';

export class KubernetesManifestTicketMapper {
  static toEntity(
    dto: CreateKubernetesManifestTicketDto,
  ): KubernetesManifestTicketEntity {
    return KubernetesManifestTicketEntity.builder()
      .withInformer(dto.informer ?? '')
      .withAssignee(dto.assignee)
      .withDepartment(dto.department)
      .withSubject(dto.subject)
      .withDescription(dto.description)
      .withStatus(TicketStatus.OPEN)
      .withNamespace(dto.namespace)
      .withAction(dto.action)
      .withCodeYaml(dto.codeYaml)
      .withResponse('')
      .build();
  }

  static toManageKubernetesManifestRequest(
    ticket: KubernetesManifestTicketEntity,
  ): ManageKubernetesManifestRequest {
    return {
      numberOfTickets: ticket.number,
      namespace: ticket.namespace,
      action: ticket.action as KubernetesManifestAction,
      manifest: ticket.codeYaml,
    };
  }
}
