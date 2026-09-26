import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketStatus } from '../ticket-status.enum';

@Entity('kubernetes_command_tickets')
export class KubernetesCommandTicketEntity {
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

  @Column('text', { name: 'code_yaml' })
  declare codeYaml: string;

  @Column('text')
  declare response: string;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;

  static builder(): KubernetesCommandTicketEntityBuilder {
    return new KubernetesCommandTicketEntityBuilder();
  }
}

export class KubernetesCommandTicketEntityBuilder {
  private readonly entity = new KubernetesCommandTicketEntity();

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

  withCodeYaml(codeYaml: string): this {
    this.entity.codeYaml = codeYaml;
    return this;
  }

  withResponse(response: string): this {
    this.entity.response = response;
    return this;
  }

  build(): KubernetesCommandTicketEntity {
    const requiredFields: Array<keyof KubernetesCommandTicketEntity> = [
      'informer',
      'assignee',
      'department',
      'subject',
      'status',
      'description',
      'codeYaml',
      'response',
    ];

    const missingField = requiredFields.find(
      (field) => this.entity[field] === undefined,
    );
    if (missingField) {
      throw new Error(
        `Cannot build KubernetesCommandTicketEntity: missing required field "${missingField}"`,
      );
    }

    return this.entity;
  }
}
