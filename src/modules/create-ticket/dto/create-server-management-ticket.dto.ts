import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotBlank } from './is-not-blank.decorator';

export class CreateServerManagementTicketDto {
  // Optional: the controller always overwrites it with the token's email.
  @ApiPropertyOptional({
    description:
      'Ignored: the server always overwrites it with the email of the authenticated user.',
    example: 'jane.doe@example.com',
    maxLength: 50,
    format: 'email',
  })
  @IsOptional()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(50)
  informer?: string;

  @ApiProperty({
    description: 'Email of the approver the ticket is assigned to.',
    example: 'john.approver@example.com',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  @MaxLength(50)
  assignee!: string;

  @ApiProperty({
    description: 'Department requesting the ticket.',
    example: 'Platform',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  @MaxLength(50)
  department!: string;

  @ApiProperty({
    description: 'Short title of the ticket. Must not be blank.',
    example: 'Add index to the orders table',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  @MaxLength(500)
  subject!: string;

  @ApiProperty({
    description: 'Detailed description of the request. Must not be blank.',
    example: 'The orders report is slow; an index on customer_id is needed.',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  @MaxLength(500)
  description!: string;

  @ApiProperty({
    description:
      'Ansible playbook executed when the ticket is approved. Must not be blank.',
    example:
      '- hosts: all\n  tasks:\n    - name: Ping\n      ansible.builtin.ping:',
  })
  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  codeAnsible!: string;
}
