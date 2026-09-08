import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Language } from '@prisma/client';

const USER_SELECT = {
  id: true,
  email: true,
  phone: true,
  name: true,
  role: true,
  preferredLanguage: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async updateLanguage(userId: string, language: Language) {
    await this.findById(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage: language },
      select: USER_SELECT,
    });
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    await this.findById(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: USER_SELECT,
    });
  }

  async listUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: USER_SELECT,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total, page, limit };
  }
}
