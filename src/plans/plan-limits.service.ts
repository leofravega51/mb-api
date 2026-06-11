import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '@/database/entities/plan.entity';
import { Tenant } from '@/database/entities/tenant.entity';
import type { PlanId } from '@/common/constants';
import { DEFAULT_PLAN_CATALOG } from '@/common/constants';
import { UserRepository } from '@/users/domain/repositories/user.repository';
import {
  buildPlanQuotaUsage,
  canAddWithinQuota,
  type PlanQuotaUsage,
} from './plan-limits.util';

@Injectable()
export class PlanLimitsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    private readonly userRepository: UserRepository,
  ) {}

  async getTenantPlan(tenantId: string): Promise<Plan> {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      relations: ['plan'],
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    if (tenant.plan) return tenant.plan;

    const plan = await this.planRepo.findOne({ where: { id: tenant.planId } });
    if (!plan) throw new NotFoundException('Plan no encontrado');
    return plan;
  }

  async getUsage(tenantId: string): Promise<PlanQuotaUsage> {
    const plan = await this.getTenantPlan(tenantId);
    const usedTeamSeats = await this.userRepository.countStaffByTenantId(tenantId);
    const usedProducts = await this.countProductsByTenantId(tenantId);

    return buildPlanQuotaUsage(
      plan.maxTeamSeats,
      plan.maxProducts,
      usedTeamSeats,
      usedProducts,
    );
  }

  async assertCanAddStaffMember(tenantId: string): Promise<void> {
    const plan = await this.getTenantPlan(tenantId);
    const used = await this.userRepository.countStaffByTenantId(tenantId);
    if (!canAddWithinQuota(plan.maxTeamSeats, used)) {
      throw new ForbiddenException(
        'Alcanzaste el límite de usuarios de equipo de tu plan',
      );
    }
  }

  async assertCanAddProduct(tenantId: string): Promise<void> {
    const plan = await this.getTenantPlan(tenantId);
    const used = await this.countProductsByTenantId(tenantId);
    if (!canAddWithinQuota(plan.maxProducts, used)) {
      throw new ForbiddenException(
        'Alcanzaste el límite de productos de tu plan',
      );
    }
  }

  /** Hasta que exista el módulo products */
  private async countProductsByTenantId(_tenantId: string): Promise<number> {
    return 0;
  }

  async ensurePlanCatalog(planId: PlanId): Promise<Plan> {
    const existing = await this.planRepo.findOne({ where: { id: planId } });
    if (existing) return existing;

    const defaults = DEFAULT_PLAN_CATALOG[planId];
    const plan = this.planRepo.create({
      id: planId,
      name: defaults.name,
      priceMonthly: String(defaults.priceMonthly),
      maxTeamSeats: defaults.maxTeamSeats,
      maxProducts: defaults.maxProducts,
      features: defaults.features,
    });
    return this.planRepo.save(plan);
  }
}
