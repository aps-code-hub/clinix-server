import { DynamicModule, Module } from '@nestjs/common';
import { RmqService } from './rmq.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

interface RmqModuleOptions {
  name: string; // The name of the service we want to talk to (e.g., 'PATIENT')
}

@Module({
  providers: [RmqService],
  exports: [RmqService],
})
export class RmqModule {
  /**
   * Used by Producers (like Auth Service) to register a client
   * that can send messages to a specific queue.
   */
  static register({ name }: RmqModuleOptions): DynamicModule {
    return {
      module: RmqModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name,
            useFactory: (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [configService.get<string>('RABBITMQ_URI') || ''],
                queue: configService.get<string>(`RABBITMQ_${name}_QUEUE`),
                queueOptions: {
                  durable: true,
                },
                exchange: configService.get<string>('RABBITMQ_EXCHANGE_NAME'),
                exchangeType: 'topic',
              },
            }),
            inject: [ConfigService],
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }
}
