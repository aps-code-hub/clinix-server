import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class RmqService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * @param queue - the specific queue name to listen (e.g. PATIENT)
   * @param noAck - If fasle, we manually acknowledge the messages
   */
  getOptions(queue: string, noAck = false): RmqOptions {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [this.configService.get<string>('RABBIT_MQ_URI') || ''],
        queue: this.configService.get<string>(`RABBIT_MQ_${queue}_QUEUE`),
        noAck, // Manual Acknowledgment
        persistent: true, // Messages are saved to disk
        queueOptions: {
          durable: true, // Queue survives broker restart
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
