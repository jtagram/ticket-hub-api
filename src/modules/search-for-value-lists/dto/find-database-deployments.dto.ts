import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class FindDatabaseDeploymentsDto {
	@ApiProperty({
		description: 'Kubernetes namespace whose deployments are listed.',
		example: 'databases',
		maxLength: 63,
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(63)
	namespace!: string;
}
