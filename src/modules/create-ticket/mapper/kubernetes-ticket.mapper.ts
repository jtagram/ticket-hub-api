import { KubernetesTicketEntity } from '../../../common/database/kubernetes-ticket/kubernetes-ticket.entity';
import { KubernetesExecutionType } from '../../../common/database/kubernetes-ticket/kubernetes-execution-type.enum';
import { TicketStatus } from '../../../common/database/ticket-status.enum';
import {
  KubernetesManifestAction,
  ManageCommandRequest,
  ManageKubernetesManifestRequest,
} from '../../infra-hub-api/infra-hub-api.types';
import { CreateKubernetesManifestTicketDto } from '../dto/create-kubernetes-manifest-ticket.dto';
import { CreateKubernetesCommandTicketDto } from '../dto/create-kubernetes-command-ticket.dto';

export class KubernetesTicketMapper {
  static toManifestEntity(
    dto: CreateKubernetesManifestTicketDto,
  ): KubernetesTicketEntity {
    return KubernetesTicketEntity.builder()
      .withInformer(dto.informer)
      .withAssignee(dto.assignee)
      .withDepartment(dto.department)
      .withSubject(dto.subject)
      .withDescription(dto.description)
      .withStatus(TicketStatus.OPEN)
      .withExecutionType(KubernetesExecutionType.MANIFEST)
      .withNamespace(dto.namespace)
      .withAction(dto.action)
      .withCodeYaml(dto.codeYaml)
      .withResponse('')
      .build();
  }

  static toCommandEntity(
    dto: CreateKubernetesCommandTicketDto,
  ): KubernetesTicketEntity {
    return KubernetesTicketEntity.builder()
      .withInformer(dto.informer)
      .withAssignee(dto.assignee)
      .withDepartment(dto.department)
      .withSubject(dto.subject)
      .withDescription(dto.description)
      .withStatus(TicketStatus.OPEN)
      .withExecutionType(KubernetesExecutionType.OTHER)
      .withCodeYaml(dto.codeYaml)
      .withResponse('')
      .build();
  }

  static toManageKubernetesManifestRequest(
    ticket: KubernetesTicketEntity,
  ): ManageKubernetesManifestRequest {
    return {
      numberOfTickets: ticket.number,
      namespace: ticket.namespace!,
      action: ticket.action as KubernetesManifestAction,
      manifest: ticket.codeYaml,
    };
  }

  static toManageKubernetesCommandRequest(
    ticket: KubernetesTicketEntity,
  ): ManageCommandRequest {
    return {
      numberOfTickets: ticket.number,
      command: ticket.codeYaml,
    };
  }
}
