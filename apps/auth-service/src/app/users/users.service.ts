import { ConflictException, Injectable } from '@nestjs/common';

import { Prisma } from '@generated/auth-client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserPayload: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({
        data: {
          ...createUserPayload,
        },
      });
      return user;
    } catch (error) {
      // Prisma error code for duplicate unique key violation (P2002)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('User already exists with this email');
      }
      throw error;
    }
  }

  async findOneByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async updateLastLogin(id: string) {
    await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        lastLogin: new Date(),
      },
    });
  }
}
