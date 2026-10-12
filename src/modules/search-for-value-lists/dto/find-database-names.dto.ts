import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FindDatabaseNamesDto {
  @ApiProperty({
    description: 'Kubernetes namespace of the database deployment.',
    example: 'databases',
    maxLength: 63,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(63)
  namespace!: string;

  @ApiProperty({
    description: 'Kubernetes deployment whose databases are listed.',
    example: 'postgres-main',
    maxLength: 63,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(63)
  deployment!: string;
}
