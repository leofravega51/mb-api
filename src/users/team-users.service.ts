import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole, isStaffRole } from '@/common/constants';
import { UserRepository } from '@/users/domain/repositories/user.repository';
import { RoleRepository } from '@/role/domain/repositories/role.repository';
import { PlanLimitsService } from '@/plans/plan-limits.service';
import { sanitizeString } from '@/common/utils/sanitize-string';
import { CreateTeamUserDto, UpdateTeamUserDto } from '@/users/dto/team-user.dto';

export interface TeamUserDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  enabled: boolean;
  createdAt: string;
}

@Injectable()
export class TeamUsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly planLimitsService: PlanLimitsService,
  ) {}

  async list(tenantId: string): Promise<{ users: TeamUserDto[]; usage: Awaited<ReturnType<PlanLimitsService['getUsage']>> }> {
    const users = await this.userRepository.findStaffByTenantId(tenantId);
    const usage = await this.planLimitsService.getUsage(tenantId);
    return {
      users: users.map((user) => this.toDto(user)),
      usage,
    };
  }

  async create(tenantId: string, dto: CreateTeamUserDto): Promise<{ user: TeamUserDto }> {
    await this.planLimitsService.assertCanAddStaffMember(tenantId);

    const email = sanitizeString(dto.email, { type: 'lower' });
    const existing = await this.userRepository.findOne({ email, tenantId });
    if (existing) {
      throw new ConflictException('El email ya está registrado en este tenant');
    }

    const role = await this.roleRepository.findByKey(dto.role);
    if (!role || !isStaffRole(role.key)) {
      throw new BadRequestException('Rol no válido para equipo');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.userRepository.create({
      tenantId,
      name: dto.name.trim(),
      email,
      phone: dto.phone?.trim(),
      passwordHash,
      role: role.key,
      enabled: true,
    });

    return { user: this.toDto(user) };
  }

  async update(
    tenantId: string,
    userId: string,
    dto: UpdateTeamUserDto,
    actorRole: string,
  ): Promise<{ user: TeamUserDto }> {
    const user = await this.userRepository.findStaffById(tenantId, userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (user.role === UserRole.OWNER) {
      throw new ForbiddenException('No se puede modificar al owner');
    }

    if (dto.role && dto.role !== user.role) {
      const role = await this.roleRepository.findByKey(dto.role);
      if (!role || !isStaffRole(role.key) || role.key === UserRole.OWNER) {
        throw new BadRequestException('Rol no válido para equipo');
      }
    }

    const updated = await this.userRepository.update(userId, {
      name: dto.name?.trim(),
      phone: dto.phone?.trim(),
      role: dto.role,
      enabled: dto.enabled,
    });

    if (!updated) throw new NotFoundException('Usuario no encontrado');
    return { user: this.toDto(updated) };
  }

  async remove(tenantId: string, userId: string, actorId: string): Promise<{ ok: true }> {
    if (userId === actorId) {
      throw new BadRequestException('No podés eliminarte a vos mismo');
    }

    const user = await this.userRepository.findStaffById(tenantId, userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (user.role === UserRole.OWNER) {
      throw new ForbiddenException('No se puede eliminar al owner');
    }

    await this.userRepository.update(userId, { enabled: false });
    return { ok: true };
  }

  private toDto(user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    enabled: boolean;
    createdAt: Date;
  }): TeamUserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role,
      enabled: user.enabled,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
