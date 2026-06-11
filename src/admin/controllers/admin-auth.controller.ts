import {
  Body,
  Controller,
  Get,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { ADMIN_COOKIE_NAME } from '@/common/constants';
import { isProduction } from '@/common/utils/is-production';
import { CurrentAdmin } from '@/common/decorators/current-admin.decorator';
import type { AdminJwtPayload } from '@/common/interfaces';
import { JwtAdminGuard } from '@/admin/guards/jwt-admin.guard';
import { AdminLoginDto } from '@/admin/dto/admin-login.dto';
import { AdminAuthService } from '@/admin/services/admin-auth.service';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  async login(
    @Body() dto: AdminLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { admin, token } = await this.adminAuthService.login(dto.email, dto.password);
    this.setCookie(res, token);
    return { admin };
  }

  @Post('logout')
  @UseGuards(JwtAdminGuard)
  logout(@Res({ passthrough: true }) res: Response): { ok: boolean } {
    this.clearCookie(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAdminGuard)
  async me(@CurrentAdmin() payload: AdminJwtPayload) {
    const admin = await this.adminAuthService.findById(payload.sub);
    if (!admin) throw new UnauthorizedException();
    return { admin };
  }

  private setCookie(res: Response, token: string): void {
    const prod = isProduction(this.config.get<string>('NODE_ENV'));
    const maxAgeMs = this.parseMaxAge(this.config.get<string>('ADMIN_JWT_EXPIRES_IN', '8h'));
    res.cookie(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
      maxAge: maxAgeMs,
    });
  }

  private clearCookie(res: Response): void {
    const prod = isProduction(this.config.get<string>('NODE_ENV'));
    res.clearCookie(ADMIN_COOKIE_NAME, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
    });
  }

  private parseMaxAge(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 8 * 60 * 60 * 1000;
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return value * (multipliers[unit] ?? 3_600_000);
  }
}
