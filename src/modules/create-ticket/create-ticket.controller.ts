import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '../../common/roles/role.enum';
import { Roles } from '../../common/guards/roles.decorator';
import { AuthenticatedUser } from '../../common/jwt/authenticated-user';
import { CreateTicketService } from './create-ticket.service';
import { CreateDatabaseManagementTicketDto } from './dto/create-database-management-ticket.dto';
import { CreateDatabaseProvisioningTicketDto } from './dto/create-database-provisioning-ticket.dto';
import { CreateServerManagementTicketDto } from './dto/create-server-management-ticket.dto';
import { CreateKubernetesManifestTicketDto } from './dto/create-kubernetes-manifest-ticket.dto';
import { CreateKubectlCommandTicketDto } from './dto/create-kubectl-command-ticket.dto';

@Controller('tickets')
export class CreateTicketController {
  constructor(private readonly createTicketService: CreateTicketService) {}

  @Post('database/management')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER)
  createDatabaseManagementTicket(
    @Body() dto: CreateDatabaseManagementTicketDto,
    @Req() request: Request,
  ) {
    dto.informer = (
      request as Request & { user: AuthenticatedUser }
    ).user.email;
    return this.createTicketService.createDatabaseManagementTicket(dto);
  }

  @Post('database/provisioning')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.DATABASE, Role.DATABASE_APPROVER)
  createDatabaseProvisioningTicket(
    @Body() dto: CreateDatabaseProvisioningTicketDto,
    @Req() request: Request,
  ) {
    dto.informer = (
      request as Request & { user: AuthenticatedUser }
    ).user.email;
    return this.createTicketService.createDatabaseProvisioningTicket(dto);
  }

  @Post('server/management')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.SERVER, Role.SERVER_APPROVER)
  createServerManagementTicket(
    @Body() dto: CreateServerManagementTicketDto,
    @Req() request: Request,
  ) {
    dto.informer = (
      request as Request & { user: AuthenticatedUser }
    ).user.email;
    return this.createTicketService.createServerManagementTicket(dto);
  }

  @Post('kubernetes/manifest')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.KUBERNATES, Role.KUBERNATES_APPROVER)
  createKubernetesManifestTicket(
    @Body() dto: CreateKubernetesManifestTicketDto,
    @Req() request: Request,
  ) {
    dto.informer = (
      request as Request & { user: AuthenticatedUser }
    ).user.email;
    return this.createTicketService.createKubernetesManifestTicket(dto);
  }

  @Post('kubernetes/kubectl')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN, Role.KUBERNATES, Role.KUBERNATES_APPROVER)
  createKubectlCommandTicket(
    @Body() dto: CreateKubectlCommandTicketDto,
    @Req() request: Request,
  ) {
    dto.informer = (
      request as Request & { user: AuthenticatedUser }
    ).user.email;
    return this.createTicketService.createKubectlCommandTicket(dto);
  }
}
