import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Injects the authenticated user from the JWT payload. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
