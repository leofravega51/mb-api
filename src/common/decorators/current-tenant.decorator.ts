import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '@/common/interfaces';

export const CurrentTenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    if (!request.user?.tenantId) {
      throw new Error('Tenant context required');
    }
    return request.user.tenantId;
  },
);
