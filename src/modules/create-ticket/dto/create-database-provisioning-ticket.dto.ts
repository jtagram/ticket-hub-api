import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotBlank } from './is-not-blank.decorator';

const POSTGRES_IDENTIFIER_PATTERN = /^[a-z_][a-z0-9_]*$/;
const POSTGRES_IDENTIFIER_MESSAGE =
  'newDbName must be a valid lowercase Postgres identifier';

export class CreateDatabaseProvisioningTicketDto {
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
    description: 'Kubernetes namespace of the database deployment.',
    example: 'databases',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  @MaxLength(50)
  dbNamespace!: string;

  @ApiProperty({
    description: 'Kubernetes deployment where the database is created.',
    example: 'postgres-main',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  @MaxLength(50)
  dbDeployment!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(63)
  @Matches(POSTGRES_IDENTIFIER_PATTERN, {
    message: POSTGRES_IDENTIFIER_MESSAGE,
  })
  @ApiProperty({
    description:
      'Name of the database to create. Must be a lowercase Postgres identifier.',
    example: 'billing_reports',
    maxLength: 63,
    pattern: '^[a-z_][a-z0-9_]*$',
  })
  newDbName!: string;
}
