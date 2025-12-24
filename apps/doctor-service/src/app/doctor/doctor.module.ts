import { Module } from '@nestjs/common';

import { RmqModule } from '@clinix/shared/rmq';
import { SharedAuthModule } from '@clinix/shared/auth';

import { DoctorService } from './doctor.service';
import { DoctorController } from './doctor.controller';

@Module({
  imports: [SharedAuthModule, RmqModule],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}
