import { Logger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class RmqService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {}

  onModuleInit() {
    this.logger.log('RmqService initialized');
  }

  /**
   * @param queue - the specific queue name to listen (e.g. PATIENT)
   * @param noAck - If fasle, we manually acknowledge the messages
   */
  getOptions(queue: string, noAck = false): RmqOptions {
    const uri = this.configService.get<string>('RABBITMQ_URI');
    const queueName = this.configService.get<string>(`RABBITMQ_${queue}_QUEUE`);
    const exchangeName = this.configService.get<string>(
      'RABBITMQ_EXCHANGE_NAME'
    );

    this.logger.log({
      msg: 'Resolving RabbitMQ Options',
      queue,
      queueName,
      mode: noAck ? 'Auto-Ack' : 'Manual-Ack (Safe)',
      exchangeName,
    });

    if (!uri || uri.trim() === '') {
      const errorMsg =
        'FATAL: RABBITMQ_URI is missing or empty in environment variables.';
      this.logger.error({ msg: errorMsg, envUri: uri });
      throw new Error(errorMsg);
    }

    if (!queueName || queueName.trim() === '') {
      const errorMsg = `FATAL: RABBITMQ_${queue}_QUEUE is missing in environment variables.`;
      this.logger.error({ msg: errorMsg, queue });
      throw new Error(errorMsg);
    }

    return {
      transport: Transport.RMQ,
      options: {
        urls: [uri],
        queue: queueName,
        noAck, // Manual Acknowledgment
        persistent: true, // Messages are saved to disk
        prefetchCount: 1, // Process one message at a time
        queueOptions: {
          durable: true,
        },
        exchange: exchangeName,
        exchangeType: 'topic',
        socketOptions: {
          clientProperties: {
            connection_name: queue,
          },
        },
      },
    };
  }

  ack(context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    channel.ack(originalMessage);
  }
}
