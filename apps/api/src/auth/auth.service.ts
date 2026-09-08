import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])] },
    });
    if (existing) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
        phone: dto.phone,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferredLanguage: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Store hashed refresh token
    const refreshHash = await bcrypt.hash(tokens.refreshToken, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: refreshHash },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferredLanguage: user.preferredLanguage,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('app.jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const refreshHash = await bcrypt.hash(tokens.refreshToken, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: refreshHash },
    });

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('app.jwt.secret'),
        expiresIn: (this.config.get<string>('app.jwt.accessExpiration') ?? '15m') as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('app.jwt.refreshSecret'),
        expiresIn: (this.config.get<string>('app.jwt.refreshExpiration') ?? '7d') as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  /** Verify a plain refresh token against the stored hash — used in tests */
  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.refreshTokenHash) return false;
    return bcrypt.compare(token, user.refreshTokenHash);
  }
}
