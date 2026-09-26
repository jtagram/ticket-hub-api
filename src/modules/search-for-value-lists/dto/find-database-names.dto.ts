import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FindDatabaseNamesDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(63)
  namespace!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(63)
  deployment!: string;
}
