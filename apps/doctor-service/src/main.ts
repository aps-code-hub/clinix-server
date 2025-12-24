import { Logger } from 'nestjs-pino';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';

import {
  GlobalExceptionsFilter,
  ResponseInterceptor,
} from '@clinix/shared/infrastructure';

import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(Logger);
  app.useLogger(logger);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionsFilter(httpAdapterHost));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  const port = process.env.PORT || 5003;
  await app.listen(port);
  logger.log(
    `🚀 Doctor service is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
