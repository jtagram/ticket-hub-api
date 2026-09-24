import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('database_tickets')
export class DatabaseTicketEntity {
  @PrimaryGeneratedColumn()
  declare id: number;

  @Column({ unique: true })
  declare number: number;

  @Column({ length: 50 })
  declare informer: string;

  @Column({ length: 50 })
  declare assignee: string;

  @Column({ length: 50 })
  declare department: string;

  @Column({ length: 500 })
  declare subject: string;

  @Column({ length: 50 })
  declare status: string;

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

  static builder(): DatabaseTicketEntityBuilder {
    return new DatabaseTicketEntityBuilder();
  }
}

export class DatabaseTicketEntityBuilder {
  private readonly entity = new DatabaseTicketEntity();

  withNumber(number: number): this {
    this.entity.number = number;
    return this;
  }

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

  withStatus(status: string): this {
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

  build(): DatabaseTicketEntity {
    const requiredFields: Array<keyof DatabaseTicketEntity> = [
      'number',
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

    const missingField = requiredFields.find(
      (field) => this.entity[field] === undefined,
    );
    if (missingField) {
      throw new Error(
        `Cannot build DatabaseTicketEntity: missing required field "${missingField}"`,
      );
    }

    return this.entity;
  }
}
