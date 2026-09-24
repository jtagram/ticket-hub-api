import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('datacenter_tickets')
export class DatacenterTicketEntity {
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

  @Column('text', { name: 'code_ansible' })
  declare codeAnsible: string;

  @Column('text')
  declare response: string;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;

  static builder(): DatacenterTicketEntityBuilder {
    return new DatacenterTicketEntityBuilder();
  }
}

export class DatacenterTicketEntityBuilder {
  private readonly entity = new DatacenterTicketEntity();

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

  withCodeAnsible(codeAnsible: string): this {
    this.entity.codeAnsible = codeAnsible;
    return this;
  }

  withResponse(response: string): this {
    this.entity.response = response;
    return this;
  }

  build(): DatacenterTicketEntity {
    const requiredFields: Array<keyof DatacenterTicketEntity> = [
      'number',
      'informer',
      'assignee',
      'department',
      'subject',
      'status',
      'description',
      'codeAnsible',
      'response',
    ];

    const missingField = requiredFields.find(
      (field) => this.entity[field] === undefined,
    );
    if (missingField) {
      throw new Error(
        `Cannot build DatacenterTicketEntity: missing required field "${missingField}"`,
      );
    }

    return this.entity;
  }
}
