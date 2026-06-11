import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '@/database/entities/tenant.entity';
import type { PlanId, TenantStatus } from '@/common/constants';

export interface CreateTenantInput {
  name: string;
  slug: string;
  planId: PlanId;
  status: TenantStatus;
  trialEndsAt: Date | null;
}

@Injectable()
export class TenantRepository {
  constructor(
    @InjectRepository(Tenant)
    private readonly repo: Repository<Tenant>,
  ) {}

  async findById(id: string): Promise<Tenant | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.repo.findOne({ where: { slug } });
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.repo.count({ where: { slug } });
    return count > 0;
  }

  async create(input: CreateTenantInput): Promise<Tenant> {
    const tenant = this.repo.create(input);
    return this.repo.save(tenant);
  }

  async save(tenant: Tenant): Promise<Tenant> {
    return this.repo.save(tenant);
  }
}
