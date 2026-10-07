import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsNotBlank } from './is-not-blank.decorator';
import { KubernetesTicketAction } from '../../../common/database/kubernetes-ticket/kubernetes-ticket-action.enum';

export class CreateKubernetesManifestTicketDto {
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
  namespace!: string;

  @IsEnum(KubernetesTicketAction)
  action!: KubernetesTicketAction;

  @IsString()
  @IsNotEmpty()
  @IsNotBlank()
  codeYaml!: string;
}
