import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '@/database/entities/plan.entity';
import { Tenant } from '@/database/entities/tenant.entity';
import type { PlatformPlanDto } from '@/admin/interfaces/admin.interfaces';

@Injectable()
export class AdminPlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async listPlans(): Promise<{ plans: PlatformPlanDto[] }> {
    const plans = await this.planRepo.find({ order: { id: 'ASC' } });

    const tenantCounts = await this.tenantRepo
      .createQueryBuilder('tenant')
      .select('tenant.plan_id', 'planId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('tenant.plan_id')
      .getRawMany<{ planId: string; count: string }>();

    const countMap = new Map(
      tenantCounts.map((row) => [row.planId, Number(row.count)]),
    );

    return {
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        priceMonthly: Number(plan.priceMonthly),
        maxTeamSeats: plan.maxTeamSeats,
        maxProducts: plan.maxProducts,
        features: plan.features ?? [],
        tenantCount: countMap.get(plan.id) ?? 0,
      })),
    };
  }
}
