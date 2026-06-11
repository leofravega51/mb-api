import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  Get,
  Logger,
  NotFoundException,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../application/services/auth.service';
import { TenantSiteService } from '@/tenants/tenant-site.service';
import { SessionResponse } from '../interfaces';
import { LoginDto } from '../dto/login.dto';
import { RegisterTenantDto } from '../dto/register-tenant.dto';
import { RecoverPasswordDto, ResetPasswordDto } from '../dto/register.dto';
import { CurrentUser, JwtPayload } from '@/common/decorators/current-user.decorator';
import { COOKIE_NAME } from '@/common/constants';
import { isProduction } from '@/common/utils/is-production';
import { JwtPermissionsGuard } from '@/common/guards/jwt-permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RequiredPermission } from '@/role/infrastructure/decorators/required-permission.decorator';
import { Permission } from '@/role/domain/models';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly tenantSiteService: TenantSiteService,
    private readonly config: ConfigService,
  ) {}

  @Get('check-slug')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  checkSlug(
    @Query('slug') slug: string,
    @Query('excludeTenantId') excludeTenantId?: string,
  ) {
    if (!slug?.trim()) throw new BadRequestException('Slug requerido');
    return this.tenantSiteService.isSlugAvailable(slug, excludeTenantId);
  }

  @Get('resolve-tenant')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  resolveTenant(@Query('slug') slug: string) {
    if (!slug?.trim()) throw new BadRequestException('Slug requerido');
    return this.authService.resolveTenantBySlug(slug);
  }

  @Post('register-tenant')
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  async registerTenant(
    @Body() dto: RegisterTenantDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponse> {
    try {
      const { user, tenant, token } = await this.authService.registerTenant(dto);
      this.setCookie(res, token);
      return { user, tenant };
    } catch (error) {
      this.logger.warn(
        `Register tenant failed for ${dto.ownerEmail}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  @Post('login')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  async login(
    @Query('tenantId') tenantId: string,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginDto,
  ): Promise<SessionResponse> {
    if (!tenantId?.trim()) throw new BadRequestException('tenantId requerido');
    try {
      const { user, tenant, token } = await this.authService.login(
        dto.email,
        dto.password,
        tenantId.trim(),
      );
      this.setCookie(res, token);
      return { user, tenant };
    } catch (error) {
      this.logger.warn(`Login failed for ${dto.email}: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async recoveryAcount(
    @Body() dto: RecoverPasswordDto,
    @Query('tenantId') tenantId?: string,
  ): Promise<{ ok: boolean; message: string }> {
    try {
      return await this.authService.forgotPassword(dto.email, tenantId);
    } catch (error) {
      this.logger.warn(
        `Recovery acount failed for ${dto.email}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  @Get('validate-reset-token')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async validateResetToken(
    @Query('token') token: string,
  ): Promise<{ valid: boolean }> {
    try {
      return await this.authService.validateResetToken(token ?? '');
    } catch (error) {
      this.logger.warn(
        `Validate reset token failed: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async confirmRecoveryPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ ok: boolean; message: string }> {
    try {
      return await this.authService.resetPassword(
        dto.token,
        dto.password,
        dto.confirmPassword,
      );
    } catch (error) {
      this.logger.warn(
        `Recover password confirm failed: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  private setCookie(res: Response, token: string): void {
    const maxAge = Number(this.config.get('COOKIE_MAX_AGE', 604800000));
    const prod = isProduction(this.config.get<string>('NODE_ENV'));
    const cookieDomain = this.config.get<string>('COOKIE_DOMAIN');
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: prod,
      sameSite: prod ? 'none' : 'lax',
      path: '/',
      maxAge,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  logout(@Res({ passthrough: true }) res: Response): { ok: boolean } {
    try {
      const prod = isProduction(this.config.get<string>('NODE_ENV'));
      const cookieDomain = this.config.get<string>('COOKIE_DOMAIN');
      res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: prod,
        sameSite: prod ? 'none' : 'lax',
        path: '/',
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      });
      return { ok: true };
    } catch (error) {
      this.logger.error(`Logout failed: ${error instanceof Error ? error.message : error}`);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'), JwtPermissionsGuard, TenantGuard)
  @RequiredPermission(Permission.SEE_PROFILE)
  async me(@CurrentUser() payload: JwtPayload): Promise<SessionResponse> {
    try {
      const session = await this.authService.getSession(payload.sub);
      if (!session) throw new NotFoundException('Usuario no encontrado');
      return session;
    } catch (error) {
      this.logger.error(`auth/me failed: ${error instanceof Error ? error.message : error}`);
      throw new NotFoundException('Usuario no encontrado');
    }
  }
}
