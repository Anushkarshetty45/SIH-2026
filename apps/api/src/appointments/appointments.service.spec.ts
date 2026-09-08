import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AppointmentStatus, SlotStatus } from '@prisma/client';
import { ConflictException } from '@nestjs/common';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prisma: any;
  let audit: any;

  const mockSlot = {
    id: 'slot-1',
    doctorId: 'doc-1',
    facilityId: 'fac-1',
    date: new Date('2026-09-10'),
    startTime: '10:00',
    endTime: '10:15',
    status: SlotStatus.AVAILABLE,
  };

  const mockPatient = {
    id: 'pat-1',
    name: 'Ramesh Kumar',
    phone: '+919876543210',
  };

  const mockAppointment = {
    id: 'appt-1',
    patientId: 'pat-1',
    doctorId: 'doc-1',
    facilityId: 'fac-1',
    slotId: 'slot-1',
    status: AppointmentStatus.SCHEDULED,
    notes: 'Regular checkup',
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: mockPatient,
    doctor: { id: 'doc-1', specialization: 'General Physician', user: { name: 'Dr. Sharma' } },
    facility: { id: 'fac-1', name: 'Shirpur PHC', district: 'Dhule' },
    slot: mockSlot,
  };

  beforeEach(async () => {
    audit = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    prisma = {
      $transaction: jest.fn(async (cb) => {
        const tx = {
          $queryRaw: jest.fn().mockResolvedValue([{ id: 'slot-1', status: SlotStatus.AVAILABLE }]),
          appointmentSlot: {
            findUnique: jest.fn().mockResolvedValue(mockSlot),
            update: jest.fn().mockResolvedValue({ ...mockSlot, status: SlotStatus.BOOKED }),
          },
          patient: {
            findUnique: jest.fn().mockResolvedValue(mockPatient),
          },
          appointment: {
            create: jest.fn().mockResolvedValue(mockAppointment),
            findUnique: jest.fn().mockResolvedValue(mockAppointment),
            update: jest
              .fn()
              .mockResolvedValue({ ...mockAppointment, status: AppointmentStatus.CANCELLED }),
          },
        };
        return cb(tx);
      }),
      appointment: {
        findUnique: jest.fn().mockResolvedValue(mockAppointment),
        findMany: jest.fn().mockResolvedValue([mockAppointment]),
        count: jest.fn().mockResolvedValue(1),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  it('should book an available slot with concurrency transaction and log audit', async () => {
    const result = await service.book(
      { patientId: 'pat-1', slotId: 'slot-1', notes: 'Regular checkup' },
      'user-asha-1',
    );

    expect(result).toBeDefined();
    expect(result.id).toBe('appt-1');
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalledWith(
      'APPOINTMENT_BOOKED',
      'user-asha-1',
      'Appointment',
      'appt-1',
      expect.any(Object),
    );
  });

  it('should prevent booking when slot is already BOOKED (conflict detection)', async () => {
    prisma.$transaction.mockImplementation(async (cb: any) => {
      const tx = {
        $queryRaw: jest.fn().mockResolvedValue([{ id: 'slot-1', status: SlotStatus.BOOKED }]),
      };
      return cb(tx);
    });

    await expect(
      service.book({ patientId: 'pat-1', slotId: 'slot-1' }, 'user-asha-1'),
    ).rejects.toThrow(ConflictException);
  });
});
