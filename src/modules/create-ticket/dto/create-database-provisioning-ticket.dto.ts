import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsNotBlank } from './is-not-blank.decorator';

const POSTGRES_IDENTIFIER_PATTERN = /^[a-z_][a-z0-9_]*$/;
const POSTGRES_IDENTIFIER_MESSAGE =
  'newDbName must be a valid lowercase Postgres identifier';

export class CreateDatabaseProvisioningTicketDto {
  // Optional: the controller always overwrites it with the token's email.
  @IsOptional()
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(50)
  informer?: string;

  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  @MaxLength(50)
  assignee!: string;

  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  @MaxLength(50)
  department!: string;

  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  @MaxLength(500)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  @MaxLength(500)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  @MaxLength(50)
  dbNamespace!: string;

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
  newDbName!: string;
}
