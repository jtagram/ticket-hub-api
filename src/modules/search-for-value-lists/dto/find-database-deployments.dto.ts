import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FindDatabaseDeploymentsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(63)
  namespace!: string;
}
