import { DatabaseProvisioningTicketEntity } from '../../../common/database/database-provisioning-ticket/database-provisioning-ticket.entity';
import { TicketStatus } from '../../../common/database/ticket-status.enum';
import { CreateDatabaseRequest } from '../../infra-hub-api/infra-hub-api.types';
import { CreateDatabaseProvisioningTicketDto } from '../dto/create-database-provisioning-ticket.dto';

export class DatabaseProvisioningTicketMapper {
  static toEntity(
    dto: CreateDatabaseProvisioningTicketDto,
  ): DatabaseProvisioningTicketEntity {
    return DatabaseProvisioningTicketEntity.builder()
      .withInformer(dto.informer ?? '')
      .withAssignee(dto.assignee)
      .withDepartment(dto.department)
      .withSubject(dto.subject)
      .withDescription(dto.description)
      .withStatus(TicketStatus.OPEN)
      .withDbNamespace(dto.dbNamespace)
      .withDbDeployment(dto.dbDeployment)
      .withNewDbName(dto.newDbName)
      .withResponse('')
      .build();
  }

  static toCreateDatabaseRequest(
    ticket: DatabaseProvisioningTicketEntity,
  ): CreateDatabaseRequest {
    return {
      numberOfTickets: ticket.number,
      namespace: ticket.dbNamespace,
      deployment: ticket.dbDeployment,
      dbName: ticket.newDbName,
    };
  }
}
