import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketStatus } from '../ticket-status.enum';
import { KubernetesExecutionType } from './kubernetes-execution-type.enum';
import { KubernetesTicketAction } from './kubernetes-ticket-action.enum';

@Entity('kubernetes_tickets')
export class KubernetesTicketEntity {
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

  // Holds the manifest YAML when executionType is MANIFEST, or an
  // Ansible-style YAML playbook when executionType is OTHER (sent as-is
  // in the "command" field to /kubernates-hub-api/manage-server).
  @Column('text', { name: 'code_yaml' })
  declare codeYaml: string;

  @Column('text')
  declare response: string;

  @Column({
    type: 'enum',
    enum: KubernetesExecutionType,
    name: 'execution_type',
  })
  declare executionType: KubernetesExecutionType;

  // Only set when executionType is MANIFEST.
  @Column({ length: 50, nullable: true })
  declare namespace?: string;

  // Only set when executionType is MANIFEST.
  @Column({ type: 'enum', enum: KubernetesTicketAction, nullable: true })
  declare action?: KubernetesTicketAction;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;

  static builder(): KubernetesTicketEntityBuilder {
    return new KubernetesTicketEntityBuilder();
  }
}

export class KubernetesTicketEntityBuilder {
  private readonly entity = new KubernetesTicketEntity();

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

  withExecutionType(executionType: KubernetesExecutionType): this {
    this.entity.executionType = executionType;
    return this;
  }

  withNamespace(namespace: string): this {
    this.entity.namespace = namespace;
    return this;
  }

  withAction(action: KubernetesTicketAction): this {
    this.entity.action = action;
    return this;
  }

  build(): KubernetesTicketEntity {
    const requiredFields: Array<keyof KubernetesTicketEntity> = [
      'informer',
      'assignee',
      'department',
      'subject',
      'status',
      'description',
      'codeYaml',
      'response',
      'executionType',
    ];

    const missingField = requiredFields.find(
      (field) => this.entity[field] === undefined,
    );
    if (missingField) {
      throw new Error(
        `Cannot build KubernetesTicketEntity: missing required field "${missingField}"`,
      );
    }

    if (
      this.entity.executionType === KubernetesExecutionType.MANIFEST &&
      (this.entity.namespace === undefined ||
        this.entity.action === undefined)
    ) {
      throw new Error(
        'Cannot build KubernetesTicketEntity: "namespace" and "action" are required when executionType is MANIFEST',
      );
    }

    return this.entity;
  }
}
