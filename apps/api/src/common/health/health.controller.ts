import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
  ) {}

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    await this.prisma.$queryRaw`SELECT 1`;
    return { database: { status: 'up' } };
  }

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check — returns service and DB status' })
  @ApiOkResponse({ description: 'Service is healthy' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([() => this.checkDatabase()]);
  }
}
