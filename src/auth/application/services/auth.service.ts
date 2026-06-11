import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { DataSource } from 'typeorm';
import { UserRole } from '@/common/constants';
import { JwtPayload } from '@/common/decorators/current-user.decorator';
import {
  SessionResponse,
  SessionTenant,
  SessionUser,
  ResolveTenantResponse,
} from '@/auth/infrastructure/interfaces';
import { RoleRepository } from '@/role/domain/repositories/role.repository';
import type { Role } from '@/role/domain/models';
import { UserRepository } from '@/users/domain/repositories/user.repository';
import { TenantRepository } from '@/tenants/tenant.repository';
import { PlanRepository } from '@/plans/plan.repository';
import { PlanLimitsService } from '@/plans/plan-limits.service';
import { sanitizeString } from '@/common/utils/sanitize-string';
import { slugify } from '@/common/utils/slugify';
import { RegisterDto } from '@/auth/infrastructure/dto/register.dto';
import { RegisterTenantDto } from '@/auth/infrastructure/dto/register-tenant.dto';
import { MailService } from '@/mail/mail.service';
import { Tenant } from '@/database/entities/tenant.entity';
import { User } from '@/database/entities/user.entity';

const TRIAL_DAYS = 14;

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly planRepository: PlanRepository,
    private readonly planLimitsService: PlanLimitsService,
    private readonly jwtService: JwtService,
    private readonly roleRepository: RoleRepository,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) {}

  async resolveTenantBySlug(slug: string): Promise<ResolveTenantResponse> {
    const normalized = slugify(slug);
    if (!normalized) throw new NotFoundException('Empresa no encontrada');

    const tenant = await this.tenantRepository.findBySlug(normalized);
    if (!tenant) throw new NotFoundException('Empresa no encontrada');
    if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
      throw new BadRequestException('Esta empresa no está disponible');
    }

    return {
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    };
  }

  async registerTenant(
    dto: RegisterTenantDto,
  ): Promise<{ user: SessionUser; tenant: SessionTenant; token: string }> {
    const ownerEmail = sanitizeString(dto.ownerEmail, { type: 'lower' });
    let slug = dto.slug ? slugify(dto.slug) : slugify(dto.companyName);

    if (!slug) throw new BadRequestException('Slug inválido');
    if (await this.tenantRepository.slugExists(slug)) {
      throw new ConflictException('El slug ya está en uso');
    }

    await this.planRepository.ensureTrialPlan();

    const ownerRole = await this.roleRepository.findByKey(UserRole.OWNER);
    if (!ownerRole) throw new ConflictException('Rol owner no configurado');

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
    const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);

    const { tenant, user } = await this.dataSource.transaction(async (manager) => {
      const tenantRepo = manager.getRepository(Tenant);
      const userRepo = manager.getRepository(User);

      const tenantEntity = tenantRepo.create({
        name: dto.companyName.trim(),
        slug,
        planId: 'trial',
        status: 'trial',
        trialEndsAt,
      });
      const savedTenant = await tenantRepo.save(tenantEntity);

      const existingUser = await userRepo.findOne({
        where: { tenantId: savedTenant.id, email: ownerEmail },
      });
      if (existingUser) {
        throw new ConflictException('El email ya está registrado en este tenant');
      }

      const userEntity = userRepo.create({
        tenantId: savedTenant.id,
        name: dto.ownerName.trim(),
        email: ownerEmail,
        phone: dto.ownerPhone?.trim() ?? null,
        passwordHash,
        role: ownerRole.key,
        enabled: true,
      });
      const savedUser = await userRepo.save(userEntity);

      return { tenant: savedTenant, user: savedUser };
    });

    const sessionUser = await this.buildSessionUser(user, ownerRole);
    const sessionTenant = await this.buildSessionTenant(tenant);
    const token = this.signToken({
      sub: sessionUser.id,
      email: sessionUser.email,
      role: sessionUser.role,
      permissions: sessionUser.permissions,
      tenantId: tenant.id,
    });

    return {
      user: sessionUser,
      tenant: sessionTenant,
      token,
    };
  }

  async findById(id: string): Promise<SessionUser | null> {
    const user = await this.userRepository.findById(id);
    if (!user) return null;
    return this.buildSessionUser(user);
  }

  async getSession(id: string): Promise<SessionResponse | null> {
    const user = await this.userRepository.findById(id);
    if (!user) return null;

    const sessionUser = await this.buildSessionUser(user);
    const sessionTenant = user.tenant
      ? await this.buildSessionTenant(user.tenant)
      : null;

    return { user: sessionUser, tenant: sessionTenant };
  }

  async validateUser(
    email: string,
    password: string,
    tenantId: string,
  ): Promise<SessionUser | null> {
    const normalizedEmail = sanitizeString(email, { type: 'lower' });
    const user = await this.userRepository.findOne({
      email: normalizedEmail,
      tenantId,
    });
    if (
      !user ||
      user.enabled === false ||
      !(await bcrypt.compare(password, user.passwordHash ?? ''))
    ) {
      return null;
    }
    return this.buildSessionUser(user);
  }

  async login(
    email: string,
    password: string,
    tenantId: string,
  ): Promise<SessionResponse & { token: string }> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) throw new NotFoundException('Empresa no encontrada');
    if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
      throw new UnauthorizedException('Esta empresa no está disponible');
    }

    const user = await this.validateUser(email, password, tenantId);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const sessionTenant = await this.buildSessionTenant(tenant);
    const token = this.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      tenantId: tenant.id,
    });

    return { user, tenant: sessionTenant, token };
  }

  async register(dto: RegisterDto): Promise<SessionResponse & { token: string }> {
    throw new BadRequestException(
      'Use register-tenant para crear un negocio o solicite una invitación',
    );
  }

  async forgotPassword(
    email: string,
    tenantId?: string,
  ): Promise<{ ok: boolean; message: string }> {
    const normalizedEmail = sanitizeString(email, { type: 'lower' });
    if (!normalizedEmail?.includes('@')) {
      throw new BadRequestException('Email inválido');
    }

    const user = await this.userRepository.findOne({
      email: normalizedEmail,
      tenantId: tenantId ?? null,
    });
    if (!user) {
      return { ok: true, message: 'Si el email existe, enviaremos instrucciones de recuperacion.' };
    }

    const recoveryToken = crypto.randomBytes(32).toString('hex');
    const recoveryExpires = new Date(Date.now() + 15 * 60 * 1000);
    await this.userRepository.update(user.id, {
      resetPasswordToken: recoveryToken,
      resetPasswordExpires: recoveryExpires,
    });

    const frontendBaseUrl = this.configService.get<string>(
      'FRONTEND_RESET_PASSWORD_URL',
      'http://localhost:5173/recover-password',
    );
    const recoveryUrl = `${frontendBaseUrl}?token=${encodeURIComponent(recoveryToken)}`;

    this.mailService.sendResetPasswordEmail(normalizedEmail, recoveryUrl);
    return { ok: true, message: 'Si el email existe, enviaremos instrucciones de recuperacion.' };
  }

  async validateResetToken(token: string): Promise<{ valid: boolean }> {
    const trimmed = token?.trim();
    if (!trimmed) throw new BadRequestException('Token inválido');

    const user = await this.userRepository.findOne({
      resetPasswordToken: trimmed,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) throw new BadRequestException('Token inválido o expirado');
    return { valid: true };
  }

  async resetPassword(
    token: string,
    password: string,
    confirmPassword: string,
  ): Promise<{ ok: boolean; message: string }> {
    if (!token?.trim()) throw new BadRequestException('Token inválido');
    if (!password || !confirmPassword) {
      throw new BadRequestException('Password y confirmPassword son requeridos');
    }
    if (password !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const user = await this.userRepository.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) throw new BadRequestException('Token inválido o expirado');

    const passwordHash = await bcrypt.hash(password, 10);
    await this.userRepository.update(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });
    return { ok: true, message: 'Contrasena actualizada correctamente.' };
  }

  signToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  private async buildSessionUser(user: User, roleOverride?: Role | null): Promise<SessionUser> {
    const role =
      roleOverride ?? (await this.findRoleByKeyOrLegacyId(String(user.role)));
    const address = user.address
      ? {
          street: user.address.street,
          zipCode: user.address.zipCode,
          addressDisplayText: user.address.addressDisplayText,
          latitude: user.address.latitude,
          longitude: user.address.longitude,
        }
      : null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      role: role?.key ?? String(user.role),
      permissions: role?.permissions ?? [],
      tenantId: user.tenantId,
      address: address ?? undefined,
    };
  }

  private async buildSessionTenant(tenant: Tenant): Promise<SessionTenant> {
    const usage = await this.planLimitsService.getUsage(tenant.id);
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.planId,
      status: tenant.status,
      trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
      usage,
    };
  }

  private async findRoleByKeyOrLegacyId(keyOrLegacyId: string): Promise<Role | null> {
    const normalizedKey = sanitizeString(keyOrLegacyId, { type: 'lower' });
    const roleByKey = await this.roleRepository.findByKey(normalizedKey);
    if (roleByKey) return roleByKey;
    return this.roleRepository.findById(keyOrLegacyId);
  }
}
