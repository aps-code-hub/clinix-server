import { Module, RequestMethod } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino/LoggerModule';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                },
              }
            : undefined,
        redact: { paths: ['req.headers.authorization', 'req.body.password'] },
      },
      forRoutes: [{ path: '*path', method: RequestMethod.ALL }],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
