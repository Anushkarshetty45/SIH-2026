import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let config: any;

  const mockUser = {
    id: 'user-123',
    email: 'asha@health.gov.in',
    phone: '+919876543210',
    passwordHash: '$2b$10$hashedpassword',
    name: 'Sunita Patil',
    role: UserRole.ASHA_WORKER,
    refreshTokenHash: null,
    isActive: true,
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('mocked.jwt.token'),
    };

    config = {
      get: jest.fn((key: string) => {
        if (key === 'app.jwt.secret') return 'jwt-secret-123';
        if (key === 'app.jwt.refreshSecret') return 'refresh-secret-123';
        if (key === 'app.jwt.accessExpiration') return '15m';
        if (key === 'app.jwt.refreshExpiration') return '7d';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: new Date(),
      });
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'asha@health.gov.in',
        password: 'Password123!',
        name: 'Sunita Patil',
        role: UserRole.ASHA_WORKER,
      });

      expect(result).toHaveProperty('id');
      expect(result.email).toBe('asha@health.gov.in');
    });

    it('should throw ConflictException if user already exists', async () => {
      prisma.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'asha@health.gov.in',
          password: 'Password123!',
          name: 'Sunita Patil',
          role: UserRole.ASHA_WORKER,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login and return tokens when credentials match', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.login({
        email: mockUser.email,
        password: 'Password123!',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result.accessToken).toBe('mocked.jwt.token');
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({
          email: mockUser.email,
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
