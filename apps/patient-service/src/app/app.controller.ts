import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard, Role, Roles, RolesGuard } from '@clinix/shared/auth';

import { AppService } from './app.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Controller({
  path: 'patient',
  version: '1',
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @Post()
  async createProfile(
    @Request() req: { user: { id: string } },
    @Body() payload: CreatePatientDto
  ) {
    const userId = req.user.id;
    return await this.appService.createPatient(userId, payload);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  @Get('me')
  async getProfile(@Request() req: { user: { id: string } }) {
    const userId = req.user.id;
    return await this.appService.getProfile(userId);
  }
}
