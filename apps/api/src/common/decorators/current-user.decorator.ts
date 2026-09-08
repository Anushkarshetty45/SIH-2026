import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

/**
 * Parameter decorator that extracts the authenticated user from the request.
 *
 * @example
 * async getMe(@CurrentUser() user: User) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: User }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
