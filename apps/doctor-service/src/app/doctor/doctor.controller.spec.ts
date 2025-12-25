import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';

import { RmqService } from '@clinix/shared/rmq';

import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';

describe('DoctorController', () => {
  let controller: DoctorController;

  const mockDoctorService = {
    createDoctor: jest.fn(),
  };

  const mockRmqService = {
    ack: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorController],
      providers: [
        { provide: DoctorService, useValue: mockDoctorService },
        { provide: RmqService, useValue: mockRmqService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    controller = module.get<DoctorController>(DoctorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
