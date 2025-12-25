import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { DoctorService } from './doctor.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DoctorService', () => {
  let service: DoctorService;

  const mockPrismaService = {
    doctor: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<DoctorService>(DoctorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
