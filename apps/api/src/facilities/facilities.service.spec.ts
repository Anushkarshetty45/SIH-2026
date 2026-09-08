import { Test, TestingModule } from '@nestjs/testing';
import { FacilitiesService } from './facilities.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { FacilityType, FacilityStatus } from '@prisma/client';

describe('FacilitiesService', () => {
  let service: FacilitiesService;
  let prisma: any;

  const mockFacility = {
    id: 'fac-1',
    name: 'Shirpur PHC',
    type: FacilityType.PHC,
    status: FacilityStatus.ACTIVE,
    address: 'Main Road',
    district: 'Dhule',
    state: 'Maharashtra',
    pincode: '425405',
    latitude: 21.35,
    longitude: 74.88,
    contactPhone: '+912563255111',
    adminId: null,
    lastUpdatedAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      facility: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };

    const config = {
      get: jest.fn().mockReturnValue(86400000),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacilitiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<FacilitiesService>(FacilitiesService);
  });

  it('should create a facility', async () => {
    prisma.facility.create.mockResolvedValue(mockFacility);

    const result = await service.create({
      name: 'Shirpur PHC',
      type: FacilityType.PHC,
      address: 'Main Road',
      district: 'Dhule',
      state: 'Maharashtra',
      pincode: '425405',
    });

    expect(result.name).toBe('Shirpur PHC');
    expect(prisma.facility.create).toHaveBeenCalled();
  });

  it('should return facility by id', async () => {
    prisma.facility.findUnique.mockResolvedValue(mockFacility);

    const result = await service.findById('fac-1');
    expect(result.id).toBe('fac-1');
  });

  it('should throw NotFoundException if facility does not exist', async () => {
    prisma.facility.findUnique.mockResolvedValue(null);

    await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
  });
});
