import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Logger } from 'nestjs-pino';

import { RmqService } from '@clinix/shared/rmq';
import { JwtAuthGuard, Role, Roles, RolesGuard } from '@clinix/shared/auth';

import { AppService } from './app.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

@Controller({
  path: 'patient',
  version: '1',
})
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly rmqService: RmqService,
    private readonly logger: Logger
  ) {}

  @EventPattern('patient.created')
  async handlePatientCreated(
    @Payload() data: CreatePatientDto & { userId: string },
    @Ctx() context: RmqContext
  ) {
    this.logger.log(`Received event: patient.created for ${data.email}`);

    await this.appService.createPatientFromEvent(data.userId, data);

    this.rmqService.ack(context);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @Post()
  async createPatient(
    @Request() req: { user: { userId: string } },
    @Body() payload: CreatePatientDto
  ) {
    const userId = req.user.userId;
    return await this.appService.createPatient(userId, payload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @Get('me')
  async getProfile(@Request() req: { user: { userId: string } }) {
    const userId = req.user.userId;
    return await this.appService.getProfile(userId);
  }
}
