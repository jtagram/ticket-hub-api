import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketStatus } from '../ticket-status.enum';

@Entity('database_management_tickets')
export class DatabaseManagementTicketEntity {
  @PrimaryGeneratedColumn()
  declare id: number;

  @Column({ unique: true })
  @Generated('increment')
  declare number: number;

  @Column({ length: 50 })
  declare informer: string;

  @Column({ length: 50 })
  declare assignee: string;

  @Column({ length: 50 })
  declare department: string;

  @Column({ length: 500 })
  declare subject: string;

  @Column({ type: 'enum', enum: TicketStatus })
  declare status: TicketStatus;

  @Column({ length: 500 })
  declare description: string;

  @Column('text')
  declare response: string;

  @Column({ name: 'db_namespace', length: 50 })
  declare dbNamespace: string;

  @Column({ name: 'db_deployment', length: 50 })
  declare dbDeployment: string;

  @Column({ name: 'db_name', length: 50 })
  declare dbName: string;

  @Column('text', { name: 'sql_code' })
  declare sqlCode: string;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;

  static builder(): DatabaseManagementTicketEntityBuilder {
    return new DatabaseManagementTicketEntityBuilder();
  }
}

export class DatabaseManagementTicketEntityBuilder {
  private readonly entity = new DatabaseManagementTicketEntity();

  withInformer(informer: string): this {
    this.entity.informer = informer;
    return this;
  }

  withAssignee(assignee: string): this {
    this.entity.assignee = assignee;
    return this;
  }

  withDepartment(department: string): this {
    this.entity.department = department;
    return this;
  }

  withSubject(subject: string): this {
    this.entity.subject = subject;
    return this;
  }

  withStatus(status: TicketStatus): this {
    this.entity.status = status;
    return this;
  }

  withDescription(description: string): this {
    this.entity.description = description;
    return this;
  }

  withResponse(response: string): this {
    this.entity.response = response;
    return this;
  }

  withDbNamespace(dbNamespace: string): this {
    this.entity.dbNamespace = dbNamespace;
    return this;
  }

  withDbDeployment(dbDeployment: string): this {
    this.entity.dbDeployment = dbDeployment;
    return this;
  }

  withDbName(dbName: string): this {
    this.entity.dbName = dbName;
    return this;
  }

  withSqlCode(sqlCode: string): this {
    this.entity.sqlCode = sqlCode;
    return this;
  }

  build(): DatabaseManagementTicketEntity {
    const requiredFields: Array<keyof DatabaseManagementTicketEntity> = [
      'informer',
      'assignee',
      'department',
      'subject',
      'status',
      'description',
      'response',
      'dbNamespace',
      'dbDeployment',
      'dbName',
      'sqlCode',
    ];

    // Text fields that must carry content. `response` is intentionally absent:
    // it starts as an empty string and is filled when a ticket is approved.
    const nonEmptyTextFields: Array<keyof DatabaseManagementTicketEntity> = [
      'informer',
      'assignee',
      'department',
      'subject',
      'description',
      'dbNamespace',
      'dbDeployment',
      'dbName',
      'sqlCode',
    ];

    const missingField = requiredFields.find((field) => {
      const value = this.entity[field];
      if (value === undefined || value === null) {
        return true;
      }
      return (
        nonEmptyTextFields.includes(field) &&
        typeof value === 'string' &&
        value.trim() === ''
      );
    });
    if (missingField) {
      throw new Error(
        `Cannot build DatabaseManagementTicketEntity: missing required field "${missingField}"`,
      );
    }

    return this.entity;
  }
}
