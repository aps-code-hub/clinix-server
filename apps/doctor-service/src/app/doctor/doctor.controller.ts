import { Logger } from 'nestjs-pino';
import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import { RmqService } from '@clinix/shared/rmq';

import { DoctorService } from './doctor.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';

@Controller({
  path: 'doctor',
  version: '1',
})
export class DoctorController {
  constructor(
    private readonly doctorService: DoctorService,
    private readonly rmqService: RmqService,
    private readonly logger: Logger
  ) {}

  @EventPattern('user.created.doctor')
  async handleDoctorCreated(
    @Payload()
    createDoctorDto: CreateDoctorDto & { userId: string },
    @Ctx() context: RmqContext
  ) {
    this.logger.log(
      `Received event: user.created.doctor for ${createDoctorDto.email}`
    );
    await this.doctorService.createDoctor(
      createDoctorDto.userId,
      createDoctorDto
    );
    this.rmqService.ack(context);
  }
}
