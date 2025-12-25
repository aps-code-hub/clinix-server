import * as amqp from 'amqplib';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class RmqService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,

    @Inject('RMQ_CONFIG')
    private readonly rmqConfig: { name: string; bindings: string[] }
  ) {}

  // SELF-HEALING: Assert Topology on Startup
  async onModuleInit() {
    const { name, bindings } = this.rmqConfig;

    // Producers (like AuthService) might not have bindings.
    if (!bindings || bindings.length === 0) return;

    const uri = this.configService.get<string>('RABBITMQ_URI');
    const queueName = this.configService.get<string>(`RABBITMQ_${name}_QUEUE`);
    const exchange = this.configService.get<string>('RABBITMQ_EXCHANGE_NAME');

    if (!uri || !queueName || !exchange) {
      this.logger.error('❌ Error: Missing RABBITMQ variables in .env file');
      this.logger.error(`URI: ${uri ? 'Defined' : 'Missing'}`);
      this.logger.error(`Queue Name: ${queueName ? 'Defined' : 'Missing'}`);
      this.logger.error(`Exchange Name: ${exchange ? 'Defined' : 'Missing'}`);
      return;
    }
    this.logger.log(`🔄 [Self-Healing] Asserting Topology for ${name}...`);
    try {
      const connection = await amqp.connect(uri);
      const channel = await connection.createChannel();

      await channel.assertExchange(exchange, 'topic', { durable: true });
      await channel.assertQueue(queueName, { durable: true });

      // 3. Create Bindings
      for (const key of bindings) {
        await channel.bindQueue(queueName, exchange, key);
        this.logger.log(`🔗 Bound ${queueName} -> ${key}`);
      }

      await channel.close();
      await connection.close();
      this.logger.log(`✅ Topology ready for ${name}`);
    } catch (err) {
      this.logger.error(`❌ Topology Assertion Failed: ${err}`);
      throw err;
    }
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

    if (!exchangeName || exchangeName.trim() === '') {
      const errorMsg = `FATAL: RABBITMQ_EXCHANGE_NAME is missing in environment variables.`;
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
