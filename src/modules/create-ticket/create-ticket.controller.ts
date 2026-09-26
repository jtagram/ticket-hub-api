import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateTicketService } from './create-ticket.service';
import { CreateDatabaseTicketDto } from './dto/create-database-ticket.dto';
import { CreateDatabaseProvisioningTicketDto } from './dto/create-database-provisioning-ticket.dto';
import { CreateDatacenterTicketDto } from './dto/create-datacenter-ticket.dto';
import { CreateKubernetesManifestTicketDto } from './dto/create-kubernetes-manifest-ticket.dto';
import { CreateKubernetesCommandTicketDto } from './dto/create-kubernetes-command-ticket.dto';

@Controller('tickets')
export class CreateTicketController {
  constructor(private readonly createTicketService: CreateTicketService) {}

  @Post('database')
  @HttpCode(HttpStatus.CREATED)
  createDatabaseTicket(@Body() dto: CreateDatabaseTicketDto) {
    return this.createTicketService.createDatabaseTicket(dto);
  }

  @Post('database/provisioning')
  @HttpCode(HttpStatus.CREATED)
  createDatabaseProvisioningTicket(
    @Body() dto: CreateDatabaseProvisioningTicketDto,
  ) {
    return this.createTicketService.createDatabaseProvisioningTicket(dto);
  }

  @Post('datacenter')
  @HttpCode(HttpStatus.CREATED)
  createDatacenterTicket(@Body() dto: CreateDatacenterTicketDto) {
    return this.createTicketService.createDatacenterTicket(dto);
  }

  @Post('kubernetes/manifest')
  @HttpCode(HttpStatus.CREATED)
  createKubernetesManifestTicket(
    @Body() dto: CreateKubernetesManifestTicketDto,
  ) {
    return this.createTicketService.createKubernetesManifestTicket(dto);
  }

  @Post('kubernetes/command')
  @HttpCode(HttpStatus.CREATED)
  createKubernetesCommandTicket(
    @Body() dto: CreateKubernetesCommandTicketDto,
  ) {
    return this.createTicketService.createKubernetesCommandTicket(dto);
  }
}
