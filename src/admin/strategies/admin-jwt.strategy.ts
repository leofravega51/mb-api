import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ADMIN_COOKIE_NAME } from '@/common/constants';
import type { AdminJwtPayload } from '@/common/interfaces';
import { AdminAuthService } from '@/admin/services/admin-auth.service';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    config: ConfigService,
    private readonly adminAuthService: AdminAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.[ADMIN_COOKIE_NAME] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('ADMIN_JWT_SECRET', 'dev-admin-secret'),
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminJwtPayload> {
    const admin = await this.adminAuthService.findById(payload.sub);
    if (!admin) throw new UnauthorizedException();
    return {
      sub: admin.id,
      email: admin.email,
      name: admin.name,
    };
  }
}
