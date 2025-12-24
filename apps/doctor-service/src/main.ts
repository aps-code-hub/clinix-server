import { Logger } from 'nestjs-pino';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';

import {
  GlobalExceptionsFilter,
  ResponseInterceptor,
} from '@clinix/shared/infrastructure';

import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { RmqService } from '@clinix/shared/rmq';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(Logger);
  app.useLogger(logger);

  const configService = app.get(ConfigService);
  const rmqUri = configService.get<string>('RABBITMQ_URI');
  const queueName = configService.get<string>('RABBITMQ_DOCTOR_SERVICE_QUEUE');

  if (!rmqUri) {
    throw new Error('FATAL: RABBITMQ_URI is not defined in .env file');
  }
  if (!queueName) {
    throw new Error(
      'FATAL: RABBITMQ_DOCTOR_SERVICE_QUEUE is not defined in .env file'
    );
  }
  logger.log({ msg: 'Connecting to RabbitMQ', uri: rmqUri, queue: queueName });

  const rmqService = app.get<RmqService>(RmqService);
  app.connectMicroservice(rmqService.getOptions('DOCTOR_SERVICE'));
  await app.startAllMicroservices();

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
