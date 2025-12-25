import { DynamicModule, Module } from '@nestjs/common';
import { RmqService } from './rmq.service';

interface RmqModuleOptions {
  name: string;
  bindings?: string[];
}

@Module({
  providers: [RmqService],
  exports: [RmqService],
})
export class RmqModule {
  /**
   * Registers the RMQ module for a service.
   * - Consumers: Provide bindings to subscribe to specific routing keys
   * - Producers: No bindings needed, use RmqService.publish() directly
   */
  static register({ name, bindings = [] }: RmqModuleOptions): DynamicModule {
    return {
      module: RmqModule,
      providers: [
        {
          provide: 'RMQ_CONFIG',
          useValue: { name, bindings },
        },
      ],
      exports: [RmqService],
    };
  }
}
