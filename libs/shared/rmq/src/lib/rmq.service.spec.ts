import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { RmqService } from './rmq.service';

describe('RmqService', () => {
  let service: RmqService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config: Record<string, string> = {
        RABBITMQ_URI: 'amqp://localhost:5672',
        RABBITMQ_EXCHANGE_NAME: 'test_exchange',
        RABBITMQ_PATIENT_QUEUE: 'patient_queue',
      };
      return config[key];
    }),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RmqService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: Logger, useValue: mockLogger },
        { provide: 'RMQ_CONFIG', useValue: { name: 'TEST', bindings: [] } },
      ],
    }).compile();

    service = module.get<RmqService>(RmqService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
