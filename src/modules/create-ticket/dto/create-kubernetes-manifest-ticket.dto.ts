import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { KubernetesTicketAction } from '../../../common/database/kubernetes-ticket/kubernetes-ticket-action.enum';

export class CreateKubernetesManifestTicketDto {
  @IsString()
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
  namespace!: string;

  @IsEnum(KubernetesTicketAction)
  action!: KubernetesTicketAction;

  @IsString()
  @IsNotEmpty()
  codeYaml!: string;
}
