import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import proxy from '@fastify/http-proxy';
import { FastifyInstance } from 'fastify';
import { CacheModule } from '@nestjs/cache-manager';
import { Module, OnModuleInit } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino/LoggerModule';
import { APP_GUARD, HttpAdapterHost } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { JwtAuthGuard, SharedAuthModule } from '@clinix/shared/auth';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/api-gateway/.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get('REDIS_HOST') || 'localhost';
        const rediPort = configService.get('REDIS_PORT') || '6379';
        const redisUrl = `redis://${redisHost}:${rediPort}`;

        return {
          stores: [
            new Keyv({
              store: new KeyvRedis({
                url: redisUrl,
              }),
            }),
          ],
          ttl: 5000,
        };
      },
      inject: [ConfigService],
    }),
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
        genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
        redact: { paths: ['req.headers.authorization', 'req.body.password'] },
      },
    }),
    SharedAuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  async onModuleInit() {
    const app = this.httpAdapterHost.httpAdapter.getInstance<FastifyInstance>();
    await app.register(async (subApp) => {
      subApp.removeContentTypeParser('application/json');
      await subApp.register(proxy, {
        upstream: 'http://localhost:5001',
        prefix: '/auth',
        rewritePrefix: '/api/v1/auth',
        http2: false,
      });
    });

    await app.register(async (subApp) => {
      subApp.removeContentTypeParser('application/json');
      await subApp.register(proxy, {
        upstream: 'http://localhost:5002',
        prefix: '/patient',
        rewritePrefix: '/api/v1/patient',
        http2: false,
      });
    });
  }
}
