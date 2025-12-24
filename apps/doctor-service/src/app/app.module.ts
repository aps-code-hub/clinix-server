import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { RequestMethod } from '@nestjs/common';

import { PrismaModule } from './prisma/prisma.module';
import { DoctorModule } from './doctor/doctor.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
      forRoutes: [{ path: '*path', method: RequestMethod.ALL }],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/doctor-service/.env',
    }),
    PrismaModule,
    DoctorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
