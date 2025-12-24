import { ConflictException, Injectable } from '@nestjs/common';

import { CreateDoctorDto } from './dto/create-doctor.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from 'nestjs-pino';

@Injectable()
export class DoctorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  async createDoctor(userId: string, doctorPayload: CreateDoctorDto) {
    try {
      const existingDoctor = await this.prisma.doctor.findFirst({
        where: {
          OR: [{ email: doctorPayload.email }, { userId }],
        },
      });

      if (existingDoctor) {
        throw new ConflictException(
          'Doctor profile already exists with this email or userId'
        );
      }

      return await this.prisma.doctor.create({
        data: {
          userId,
          firstName: doctorPayload.firstName,
          lastName: doctorPayload.lastName,
          email: doctorPayload.email,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create doctor profile', error);
      throw error;
    }
  }
}
