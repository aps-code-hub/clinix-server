import * as amqp from 'amqplib';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { RmqContext, RmqOptions, Transport } from '@nestjs/microservices';

@Injectable()
export class RmqService implements OnModuleDestroy {
  private publishConnection: Awaited<ReturnType<typeof amqp.connect>> | null =
    null;
  private publishChannel: amqp.Channel | null = null;

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
      this.logger.error(
        `Queue Name: << ${name} >> ${queueName ? 'Defined' : 'Missing'}`
      );
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

  /**
   * Publish a message to the topic exchange with a routing key.
   * This properly routes messages through the exchange for topic-based routing.
   * @param routingKey - The routing key (e.g., 'user.created.patient')
   * @param message - The message payload to publish
   */
  async publish<T>(routingKey: string, message: T): Promise<void> {
    const uri = this.configService.get<string>('RABBITMQ_URI');
    const exchange = this.configService.get<string>('RABBITMQ_EXCHANGE_NAME');

    if (!uri || !exchange) {
      this.logger.error({
        msg: '❌ Cannot publish: Missing RabbitMQ configuration',
        uri: uri ? 'Defined' : 'Missing',
        exchange: exchange ? 'Defined' : 'Missing',
      });
      throw new Error('Missing RabbitMQ configuration for publishing');
    }

    try {
      // Lazy initialize connection and channel for publishing
      if (!this.publishConnection || !this.publishChannel) {
        this.publishConnection = await amqp.connect(uri);
        this.publishChannel = await this.publishConnection.createChannel();
        await this.publishChannel.assertExchange(exchange, 'topic', {
          durable: true,
        });
        this.logger.log(`📡 Publisher connected to exchange: ${exchange}`);
      }

      // NestJS expects messages in { pattern, data } format for @EventPattern
      const nestJsMessage = {
        pattern: routingKey,
        data: message,
      };

      const messageBuffer = Buffer.from(JSON.stringify(nestJsMessage));
      this.publishChannel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        contentType: 'application/json',
      });

      this.logger.log({
        msg: `📤 Published event`,
        routingKey,
        exchange,
      });
    } catch (error) {
      this.logger.error({
        msg: '❌ Failed to publish message',
        routingKey,
        error: error instanceof Error ? error.message : error,
      });
      // Reset connection on error for retry
      this.publishConnection = null;
      this.publishChannel = null;
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      if (this.publishChannel) {
        await this.publishChannel.close();
      }
      if (this.publishConnection) {
        await this.publishConnection.close();
      }
      this.logger.log('🔌 RMQ publisher connection closed');
    } catch (error) {
      this.logger.error('Error closing RMQ connection', error);
    }
  }
}
