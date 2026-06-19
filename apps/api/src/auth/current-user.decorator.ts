import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from './roles.enum';

/** Injects the authenticated {@link AuthUser} into a controller handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    return request.user;
  },
);
