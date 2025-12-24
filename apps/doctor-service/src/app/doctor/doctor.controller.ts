import { Logger } from 'nestjs-pino';
import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';

import { RmqService } from '@clinix/shared/rmq';
// import { JwtAuthGuard, Role, Roles, RolesGuard } from '@clinix/shared/auth';

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

  //   @UseGuards(JwtAuthGuard, RolesGuard)
  //   @Roles(Role.DOCTOR)
  //   @Post()
  //   async updateDoctor(
  //     @Request() req: { user: { userId: string } },
  //     @Body() updateDoctorDto: UpdateDoctorDto
  //   ) {
  //     const userId = req.user.userId;
  //     return this.doctorService.updateDoctor(userId, updateDoctorDto);
  //   }
}
