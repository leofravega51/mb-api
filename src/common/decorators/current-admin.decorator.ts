import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AdminJwtPayload } from '@/common/interfaces';

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminJwtPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: AdminJwtPayload }>();
    return request.user;
  },
);
