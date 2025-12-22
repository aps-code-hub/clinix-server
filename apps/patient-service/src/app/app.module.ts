import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { Module, RequestMethod } from '@nestjs/common';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';

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
      envFilePath: ['apps/patient-service/.env'],
    }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
