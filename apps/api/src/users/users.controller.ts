import { Controller, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateLanguageDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update profile name/phone' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Patch('me/language')
  @ApiOperation({ summary: 'Update preferred language (Marathi / Hindi / English)' })
  updateLanguage(@CurrentUser('id') userId: string, @Body() dto: UpdateLanguageDto) {
    return this.usersService.updateLanguage(userId, dto.preferredLanguage);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listUsers(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.usersService.listUsers(+page, +limit);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
  @ApiOperation({ summary: 'Get a user by ID (admin only)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
