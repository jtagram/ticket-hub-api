import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '../ticket-status.enum';

@Entity('server_management_tickets')
export class ServerManagementTicketEntity {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    type: Number,
    description: 'Internal primary key.',
    example: 1,
  })
  declare id: number;

  @Column({ unique: true })
  @Generated('increment')
  @ApiProperty({
    type: Number,
    description:
      'Sequential ticket number used in the URLs of the ticket endpoints.',
    example: 42,
  })
  declare number: number;

  @Column({ length: 50 })
  @ApiProperty({
    type: String,
    description:
      'Email of the user who created the ticket, taken from the access token.',
    example: 'jane.doe@example.com',
    maxLength: 50,
  })
  declare informer: string;

  @Column({ length: 50 })
  @ApiProperty({
    type: String,
    description: 'Email of the approver the ticket is assigned to.',
    example: 'john.approver@example.com',
    maxLength: 50,
  })
  declare assignee: string;

  @Column({ length: 50 })
  @ApiProperty({
    type: String,
    description: 'Department that requested the ticket.',
    example: 'Platform',
    maxLength: 50,
  })
  declare department: string;

  @Column({ length: 500 })
  @ApiProperty({
    type: String,
    description: 'Short title of the ticket.',
    example: 'Add index to the orders table',
    maxLength: 500,
  })
  declare subject: string;

  @Column({ type: 'enum', enum: TicketStatus })
  @ApiProperty({
    enum: TicketStatus,
    enumName: 'TicketStatus',
    description: 'Current status of the ticket. New tickets are `OPEN`.',
    example: TicketStatus.OPEN,
  })
  declare status: TicketStatus;

  @Column({ length: 500 })
  @ApiProperty({
    type: String,
    description: 'Detailed description of the request.',
    example: 'The orders report is slow; an index on customer_id is needed.',
    maxLength: 500,
  })
  declare description: string;

  @Column('text', { name: 'code_ansible' })
  @ApiProperty({
    type: String,
    description: 'Ansible playbook executed when the ticket is approved.',
    example:
      '- hosts: all\n  tasks:\n    - name: Ping\n      ansible.builtin.ping:',
  })
  declare codeAnsible: string;

  @Column('text')
  @ApiProperty({
    type: String,
    description:
      'Empty until the ticket is approved; afterwards the JSON-serialized execution result returned by infra-hub-api.',
    example: '',
  })
  declare response: string;

  @CreateDateColumn({ name: 'created_at' })
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Creation timestamp.',
    example: '2026-01-15T10:30:00.000Z',
  })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'Last update timestamp.',
    example: '2026-01-15T10:30:00.000Z',
  })
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
