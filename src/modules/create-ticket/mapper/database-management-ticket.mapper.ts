import { DatabaseManagementTicketEntity } from '../../../common/database/database-management-ticket/database-management-ticket.entity';
import { TicketStatus } from '../../../common/database/ticket-status.enum';
import { ManageDatabaseRequest } from '../../infra-hub-api/infra-hub-api.types';
import { CreateDatabaseManagementTicketDto } from '../dto/create-database-management-ticket.dto';

export class DatabaseManagementTicketMapper {
  static toEntity(
    dto: CreateDatabaseManagementTicketDto,
  ): DatabaseManagementTicketEntity {
    return DatabaseManagementTicketEntity.builder()
      .withInformer(dto.informer ?? '')
      .withAssignee(dto.assignee)
      .withDepartment(dto.department)
      .withSubject(dto.subject)
      .withDescription(dto.description)
      .withStatus(TicketStatus.OPEN)
      .withDbNamespace(dto.dbNamespace)
      .withDbDeployment(dto.dbDeployment)
      .withDbName(dto.dbName)
      .withSqlCode(dto.sqlCode)
      .withResponse('')
      .build();
  }

  static toManageDatabaseRequest(
    ticket: DatabaseManagementTicketEntity,
  ): ManageDatabaseRequest {
    return {
      numberOfTickets: ticket.number,
      namespace: ticket.dbNamespace,
      deployment: ticket.dbDeployment,
      dbName: ticket.dbName,
      sqlCode: ticket.sqlCode,
    };
  }
}
