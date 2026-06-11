import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, MoreThan, Repository } from 'typeorm';
import { STAFF_ROLES } from '@/common/constants';
import { User, type UserAddress } from '@/database/entities/user.entity';

export interface CreateUserInput {
  tenantId?: string | null;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: string;
  address?: UserAddress;
  enabled?: boolean;
}

export interface UpdateTeamUserInput {
  name?: string;
  phone?: string | null;
  role?: string;
  enabled?: boolean;
  passwordHash?: string;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
}

export interface FindUserFilter {
  email?: string;
  tenantId?: string | null;
  resetPasswordToken?: string;
  resetPasswordExpires?: { $gt: Date };
}

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id }, relations: ['tenant'] });
  }

  async findOne(filter: FindUserFilter): Promise<User | null> {
    if (filter.resetPasswordToken && filter.resetPasswordExpires?.$gt) {
      return this.repo.findOne({
        where: {
          resetPasswordToken: filter.resetPasswordToken,
          resetPasswordExpires: MoreThan(filter.resetPasswordExpires.$gt),
        },
      });
    }

    const where: Record<string, unknown> = {};
    if (filter.email !== undefined) where.email = filter.email;
    if (filter.tenantId !== undefined) {
      where.tenantId = filter.tenantId === null ? IsNull() : filter.tenantId;
    }
    if (filter.resetPasswordToken !== undefined) {
      where.resetPasswordToken = filter.resetPasswordToken;
    }

    return this.repo.findOne({ where: where as never });
  }

  async create(input: CreateUserInput): Promise<User> {
    const user = this.repo.create({
      tenantId: input.tenantId ?? null,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash: input.passwordHash,
      role: input.role,
      address: input.address ?? null,
      enabled: input.enabled ?? true,
    });
    return this.repo.save(user);
  }

  async update(id: string, input: UpdateTeamUserInput): Promise<User | null> {
    await this.repo.update(id, input);
    return this.findById(id);
  }

  async countStaffByTenantId(tenantId: string): Promise<number> {
    return this.repo.count({
      where: { tenantId, role: In([...STAFF_ROLES]), enabled: true },
    });
  }

  async findStaffByTenantId(tenantId: string): Promise<User[]> {
    return this.repo.find({
      where: { tenantId, role: In([...STAFF_ROLES]) },
      order: { createdAt: 'ASC' },
    });
  }

  async findStaffById(tenantId: string, userId: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id: userId, tenantId, role: In([...STAFF_ROLES]) },
    });
  }

  async countByTenantId(tenantId: string): Promise<number> {
    return this.repo.count({ where: { tenantId } });
  }

  async findOwnerEmailByTenantId(tenantId: string): Promise<string | null> {
    const owner = await this.repo.findOne({
      where: { tenantId, role: 'owner' },
      order: { createdAt: 'ASC' },
    });
    if (owner) return owner.email;

    const admin = await this.repo.findOne({
      where: { tenantId, role: 'admin' },
      order: { createdAt: 'ASC' },
    });
    return admin?.email ?? null;
  }
}
