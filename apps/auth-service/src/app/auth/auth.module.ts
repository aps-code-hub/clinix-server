import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { HashingService } from './hashing/hashing.service';

import { RmqModule } from '@clinix/shared/rmq';
import { SharedAuthModule } from '@clinix/shared/auth';

@Module({
  imports: [
    UsersModule,
    SharedAuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN') || '1d',
        },
      }),
    }),
    RmqModule.register({
      name: 'PATIENT_SERVICE',
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, HashingService],
})
export class AuthModule {}
