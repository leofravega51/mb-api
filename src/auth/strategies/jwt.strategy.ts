import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { COOKIE_NAME } from '@/common/constants';
import { AuthService } from '@/auth/application/services/auth.service';
import { JwtPayload } from '@/common/interfaces';
import { UsersWebsocketService } from '@/users/application/services/users-websocket.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
    private readonly usersWebsocketService: UsersWebsocketService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => {
          return req?.cookies?.[COOKIE_NAME] ?? null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'default-secret-change-me'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (this.usersWebsocketService.isUserSessionRevoked(payload.sub)) {
      throw new UnauthorizedException();
    }
    const user = await this.authService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      tenantId: payload.tenantId ?? user.tenantId ?? undefined,
    };
  }
}
