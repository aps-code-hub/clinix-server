import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { Module, RequestMethod } from '@nestjs/common';

import { SharedAuthModule } from '@clinix/shared/auth';
import { RmqModule } from '@clinix/shared/rmq';

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
      envFilePath: '.env',
    }),
    PrismaModule,
    SharedAuthModule,
    RmqModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
