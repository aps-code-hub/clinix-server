import { ConflictException, Injectable } from '@nestjs/common';

import { Prisma } from '@generated/patient-client';

import { PrismaService } from './prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly patientSelect = {
    firstName: true,
    lastName: true,
    dateOfBirth: true,
    gender: true,
    bloodGroup: true,
    phone: true,
    email: true,
    address: true,
    emergencyContacts: true,
    insurance: {
      select: {
        providerName: true,
        policyNumber: true,
        policyHolder: true,
        groupNumber: true,
        expirationDate: true,
      },
    },
  } satisfies Prisma.PatientSelect;

  async createPatient(userId: string, payload: CreatePatientDto) {
    const existingPatient = await this.prisma.patient.findUnique({
      where: {
        userId,
      },
    });

    if (existingPatient) {
      throw new ConflictException(
        'Patient profile already exists for this user'
      );
    }

    const addressData = payload.address
      ? (payload.address as unknown as Prisma.InputJsonValue)
      : undefined;

    const emergencyContactData = payload.emergencyContacts
      ? (payload.emergencyContacts as unknown as Prisma.InputJsonValue)
      : undefined;

    return this.prisma.patient.create({
      data: {
        userId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        dateOfBirth: new Date(payload.dateOfBirth),
        gender: payload.gender,
        bloodGroup: payload.bloodGroup,
        phone: payload.phone,
        email: payload.email,
        address: addressData,
        emergencyContacts: emergencyContactData,
        insurance:
          payload.insurance?.length > 0
            ? {
                create: payload.insurance.map((ins) => ({
                  providerName: ins.providerName,
                  policyNumber: ins.policyNumber,
                  policyHolder: ins.policyHolder,
                  groupNumber: ins.groupNumber,
                  expirationDate: ins.expirationDate
                    ? new Date(ins.expirationDate)
                    : null,
                })),
              }
            : undefined,
      },
      select: this.patientSelect,
    });
  }

  async getProfile(userId: string) {
    return await this.prisma.patient.findUnique({
      where: {
        userId,
      },
      select: this.patientSelect,
    });
  }
}
