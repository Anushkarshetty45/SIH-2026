import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict an endpoint to specific roles.
 * Must be used with RolesGuard + JwtAuthGuard.
 *
 * @example
 * @Roles(UserRole.SUPER_ADMIN, UserRole.HOSPITAL_ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
