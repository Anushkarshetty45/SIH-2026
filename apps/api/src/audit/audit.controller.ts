import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'List audit logs with filtering (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  async list(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
  ) {
    return this.auditService.list(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      entity,
      action,
    );
  }

  @Get('entity/:entity/:entityId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get audit logs for a specific entity' })
  async getByEntity(@Param('entity') entity: string, @Param('entityId') entityId: string) {
    return this.auditService.findByEntity(entity, entityId);
  }
}
