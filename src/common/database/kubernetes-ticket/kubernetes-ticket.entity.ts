import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('kubernetes_tickets')
export class KubernetesTicketEntity {
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

  @Column('text', { name: 'code_yaml' })
  declare codeYaml: string;

  @Column('text')
  declare response: string;

  @Column({ name: 'execution_type', length: 10 })
  declare executionType: string;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;
}
