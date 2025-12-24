import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule } from '@nestjs/config';
import { RequestMethod } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
