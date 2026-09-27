import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDatabaseManagementTicketDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(50)
  informer!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  assignee!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  department!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  dbNamespace!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  dbDeployment!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  dbName!: string;

  @IsString()
  @IsNotEmpty()
  sqlCode!: string;
}
