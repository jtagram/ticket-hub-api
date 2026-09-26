import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketStatus } from '../ticket-status.enum';

@Entity('database_provisioning_tickets')
export class DatabaseProvisioningTicketEntity {
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

  @Column({ name: 'new_db_name', length: 63 })
  declare newDbName: string;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;

  static builder(): DatabaseProvisioningTicketEntityBuilder {
    return new DatabaseProvisioningTicketEntityBuilder();
  }
}

export class DatabaseProvisioningTicketEntityBuilder {
  private readonly entity = new DatabaseProvisioningTicketEntity();

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

  withNewDbName(newDbName: string): this {
    this.entity.newDbName = newDbName;
    return this;
  }

  build(): DatabaseProvisioningTicketEntity {
    const requiredFields: Array<keyof DatabaseProvisioningTicketEntity> = [
      'informer',
      'assignee',
      'department',
      'subject',
      'status',
      'description',
      'response',
      'dbNamespace',
      'dbDeployment',
      'newDbName',
    ];

    const missingField = requiredFields.find(
      (field) => this.entity[field] === undefined,
    );
    if (missingField) {
      throw new Error(
        `Cannot build DatabaseProvisioningTicketEntity: missing required field "${missingField}"`,
      );
    }

    return this.entity;
  }
}
