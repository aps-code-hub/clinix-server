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
    private readonly rmqService: RmqService
  ) {}

  @EventPattern('doctor.created')
  async handleDoctorCreated(
    @Payload() doctorPayload: CreateDoctorDto & { userId: string },
    @Ctx() context: RmqContext
  ) {
    await this.doctorService.createDoctor(doctorPayload.userId, doctorPayload);
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
