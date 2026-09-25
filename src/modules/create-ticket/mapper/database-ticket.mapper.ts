import { DatabaseTicketEntity } from '../../../common/database/database-ticket/database-ticket.entity';
import { TicketStatus } from '../../../common/database/ticket-status.enum';
import { ManageDatabaseRequest } from '../../infra-hub-api/infra-hub-api.types';
import { CreateDatabaseTicketDto } from '../dto/create-database-ticket.dto';

export class DatabaseTicketMapper {
  static toEntity(dto: CreateDatabaseTicketDto): DatabaseTicketEntity {
    return DatabaseTicketEntity.builder()
      .withInformer(dto.informer)
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
    ticket: DatabaseTicketEntity,
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
