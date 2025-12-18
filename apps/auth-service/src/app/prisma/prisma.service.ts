import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@generated/auth-client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // readonly extended = this.$extends({
  //   model: {
  //     user: {
  //       async findByEmail(email: string) {
  //         return this.findUnique({ where: { email } });
  //       },
  //     },
  //   },
  // });

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
