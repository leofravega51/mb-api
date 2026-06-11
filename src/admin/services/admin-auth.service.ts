import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { PlatformAdmin } from '@/database/entities/platform-admin.entity';
import type { AdminJwtPayload } from '@/common/interfaces';
import type { PlatformAdminDto } from '@/admin/interfaces/admin.interfaces';
import { sanitizeString } from '@/common/utils/sanitize-string';

@Injectable()
export class AdminAuthService {
  private readonly adminJwtService: JwtService;

  constructor(
    @InjectRepository(PlatformAdmin)
    private readonly adminRepo: Repository<PlatformAdmin>,
    private readonly config: ConfigService,
  ) {
    this.adminJwtService = new JwtService({
      secret: this.config.get<string>('ADMIN_JWT_SECRET', 'dev-admin-secret'),
      signOptions: {
        expiresIn: this.config.get<string>('ADMIN_JWT_EXPIRES_IN', '8h'),
      },
    });
  }

  toDto(admin: PlatformAdmin): PlatformAdminDto {
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    };
  }

  async findById(id: string): Promise<PlatformAdminDto | null> {
    const admin = await this.adminRepo.findOne({ where: { id } });
    return admin ? this.toDto(admin) : null;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ admin: PlatformAdminDto; token: string }> {
    const normalizedEmail = sanitizeString(email, { type: 'lower' });
    const admin = await this.adminRepo.findOne({ where: { email: normalizedEmail } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload: AdminJwtPayload = {
      sub: admin.id,
      email: admin.email,
      name: admin.name,
    };

    return {
      admin: this.toDto(admin),
      token: this.adminJwtService.sign(payload),
    };
  }

  signToken(payload: AdminJwtPayload): string {
    return this.adminJwtService.sign(payload);
  }
}
