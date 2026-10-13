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
import { KubernetesTicketAction } from '../kubernetes-ticket/kubernetes-ticket-action.enum';

@Entity('kubernetes_manifest_tickets')
export class KubernetesManifestTicketEntity {
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

	@Column({ length: 50 })
	@ApiProperty({
		type: String,
		description: 'Kubernetes namespace the manifest is applied to.',
		example: 'default',
		maxLength: 50,
	})
	declare namespace: string;

	@Column({ type: 'enum', enum: KubernetesTicketAction })
	@ApiProperty({
		enum: KubernetesTicketAction,
		enumName: 'KubernetesTicketAction',
		description: 'kubectl action performed with the manifest.',
		example: KubernetesTicketAction.APPLY,
	})
	declare action: KubernetesTicketAction;

	@Column('text', { name: 'code_yaml' })
	@ApiProperty({
		type: String,
		description: 'Kubernetes manifest (YAML) used when the ticket is approved.',
		example: 'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: demo',
	})
	declare codeYaml: string;

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
			return nonEmptyTextFields.includes(field) && typeof value === 'string' && value.trim() === '';
		});
		if (missingField) {
			throw new Error(
				`Cannot build KubernetesManifestTicketEntity: missing required field "${missingField}"`,
			);
		}

		return this.entity;
	}
}
