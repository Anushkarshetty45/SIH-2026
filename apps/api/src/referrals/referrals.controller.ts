import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import {
  CreateReferralDto,
  RespondReferralDto,
  CancelReferralDto,
  ReferralQueryDto,
} from './dto/referral.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, UserRole } from '@prisma/client';

@ApiTags('referrals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Post()
  @Roles(
    UserRole.ASHA_WORKER,
    UserRole.PHC_STAFF,
    UserRole.DOCTOR,
    UserRole.HOSPITAL_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Create a new referral for a patient' })
  async create(@Body() dto: CreateReferralDto, @CurrentUser() user: User) {
    return this.referralsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List referrals with optional filters and pagination' })
  async list(@Query() query: ReferralQueryDto, @CurrentUser() user: User) {
    return this.referralsService.list(query, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get referral details by ID' })
  async findById(@Param('id') id: string) {
    return this.referralsService.findById(id);
  }

  @Patch(':id/respond')
  @Roles(UserRole.DOCTOR, UserRole.HOSPITAL_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Respond to a referral (Approve or Reject)' })
  async respond(
    @Param('id') id: string,
    @Body() dto: RespondReferralDto,
    @CurrentUser() user: User,
  ) {
    return this.referralsService.respond(id, dto, user.id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending referral' })
  async cancel(@Param('id') id: string, @Body() dto: CancelReferralDto, @CurrentUser() user: User) {
    return this.referralsService.cancel(id, dto, user.id);
  }
}
