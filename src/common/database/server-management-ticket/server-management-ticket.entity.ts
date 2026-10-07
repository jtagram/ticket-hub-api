import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketStatus } from '../ticket-status.enum';

@Entity('server_management_tickets')
export class ServerManagementTicketEntity {
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

  @Column('text', { name: 'code_ansible' })
  declare codeAnsible: string;

  @Column('text')
  declare response: string;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;

  static builder(): ServerManagementTicketEntityBuilder {
    return new ServerManagementTicketEntityBuilder();
  }
}

export class ServerManagementTicketEntityBuilder {
  private readonly entity = new ServerManagementTicketEntity();

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

  withCodeAnsible(codeAnsible: string): this {
    this.entity.codeAnsible = codeAnsible;
    return this;
  }

  withResponse(response: string): this {
    this.entity.response = response;
    return this;
  }

  build(): ServerManagementTicketEntity {
    const requiredFields: Array<keyof ServerManagementTicketEntity> = [
      'informer',
      'assignee',
      'department',
      'subject',
      'status',
      'description',
      'codeAnsible',
      'response',
    ];

    // Text fields that must carry content. `response` is intentionally absent:
    // it starts as an empty string and is filled when a ticket is approved.
    const nonEmptyTextFields: Array<keyof ServerManagementTicketEntity> = [
      'informer',
      'assignee',
      'department',
      'subject',
      'description',
      'codeAnsible',
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
        `Cannot build ServerManagementTicketEntity: missing required field "${missingField}"`,
      );
    }

    return this.entity;
  }
}
