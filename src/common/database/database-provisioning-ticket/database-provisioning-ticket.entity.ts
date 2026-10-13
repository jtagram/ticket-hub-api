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

@Entity('database_provisioning_tickets')
export class DatabaseProvisioningTicketEntity {
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
		description: 'Sequential ticket number used in the URLs of the ticket endpoints.',
		example: 42,
	})
	declare number: number;

	@Column({ length: 50 })
	@ApiProperty({
		type: String,
		description: 'Email of the user who created the ticket, taken from the access token.',
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

	@Column('text')
	@ApiProperty({
		type: String,
		description:
			'Empty until the ticket is approved; afterwards the JSON-serialized execution result returned by infra-hub-api.',
		example: '',
	})
	declare response: string;

	@Column({ name: 'db_namespace', length: 50 })
	@ApiProperty({
		type: String,
		description: 'Kubernetes namespace of the database deployment.',
		example: 'databases',
		maxLength: 50,
	})
	declare dbNamespace: string;

	@Column({ name: 'db_deployment', length: 50 })
	@ApiProperty({
		type: String,
		description: 'Kubernetes deployment where the database is created.',
		example: 'postgres-main',
		maxLength: 50,
	})
	declare dbDeployment: string;

	@Column({ name: 'new_db_name', length: 63 })
	@ApiProperty({
		type: String,
		description: 'Name of the database to create (lowercase Postgres identifier).',
		example: 'billing_reports',
		maxLength: 63,
	})
	declare newDbName: string;

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

		// Text fields that must carry content. `response` is intentionally absent:
		// it starts as an empty string and is filled when a ticket is approved.
		const nonEmptyTextFields: Array<keyof DatabaseProvisioningTicketEntity> = [
			'informer',
			'assignee',
			'department',
			'subject',
			'description',
			'dbNamespace',
			'dbDeployment',
			'newDbName',
		];

		const missingField = requiredFields.find((field) => {
			const value = this.entity[field];
			if (value === undefined || value === null) {
				return true;
			}
			return nonEmptyTextFields.includes(field) && typeof value === 'string' && value.trim() === '';
		});
		if (missingField) {
			throw new Error(
				`Cannot build DatabaseProvisioningTicketEntity: missing required field "${missingField}"`,
			);
		}

		return this.entity;
	}
}
