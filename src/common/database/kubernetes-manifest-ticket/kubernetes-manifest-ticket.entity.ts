import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TicketStatus } from '../ticket-status.enum';
import { KubernetesTicketAction } from '../kubernetes-ticket/kubernetes-ticket-action.enum';

@Entity('kubernetes_manifest_tickets')
export class KubernetesManifestTicketEntity {
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

  @Column({ length: 50 })
  declare namespace: string;

  @Column({ type: 'enum', enum: KubernetesTicketAction })
  declare action: KubernetesTicketAction;

  @Column('text', { name: 'code_yaml' })
  declare codeYaml: string;

  @Column('text')
  declare response: string;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;

  static builder(): KubernetesManifestTicketEntityBuilder {
    return new KubernetesManifestTicketEntityBuilder();
  }
}

export class KubernetesManifestTicketEntityBuilder {
  private readonly entity = new KubernetesManifestTicketEntity();

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

  withNamespace(namespace: string): this {
    this.entity.namespace = namespace;
    return this;
  }

  withAction(action: KubernetesTicketAction): this {
    this.entity.action = action;
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

  build(): KubernetesManifestTicketEntity {
    const requiredFields: Array<keyof KubernetesManifestTicketEntity> = [
      'informer',
      'assignee',
      'department',
      'subject',
      'status',
      'description',
      'namespace',
      'action',
      'codeYaml',
      'response',
    ];

    // Text fields that must carry content. `response` is intentionally absent:
    // it starts as an empty string and is filled when a ticket is approved.
    const nonEmptyTextFields: Array<keyof KubernetesManifestTicketEntity> = [
      'informer',
      'assignee',
      'department',
      'subject',
      'description',
      'namespace',
      'codeYaml',
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
        `Cannot build KubernetesManifestTicketEntity: missing required field "${missingField}"`,
      );
    }

    return this.entity;
  }
}
