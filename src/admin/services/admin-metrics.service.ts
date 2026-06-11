import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '@/database/entities/tenant.entity';
import { SPANISH_MONTH_LABELS } from '@/common/constants';
import type { PlatformMetricsDto } from '@/admin/interfaces/admin.interfaces';

@Injectable()
export class AdminMetricsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async getMetrics(): Promise<PlatformMetricsDto> {
    const tenants = await this.tenantRepo.find({ relations: ['plan'] });

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.status === 'active').length;
    const trialTenants = tenants.filter((t) => t.status === 'trial').length;

    const activeWithPlan = tenants.filter((t) => t.status === 'active' && t.plan);
    const totalMrr = activeWithPlan.reduce(
      (sum, t) => sum + Number(t.plan.priceMonthly),
      0,
    );
    const totalRevenue = totalMrr * 12;

    const planMap = new Map<string, { revenue: number; count: number }>();
    for (const tenant of activeWithPlan) {
      const planName = tenant.plan.name;
      const current = planMap.get(planName) ?? { revenue: 0, count: 0 };
      current.revenue += Number(tenant.plan.priceMonthly);
      current.count += 1;
      planMap.set(planName, current);
    }

    const revenueByPlan = Array.from(planMap.entries()).map(([plan, data]) => ({
      plan,
      revenue: data.revenue,
      count: data.count,
    }));

    const tenantsGrowth = this.buildTenantsGrowth(tenants);

    return {
      totalTenants,
      activeTenants,
      trialTenants,
      totalMrr,
      totalRevenue,
      revenueByPlan,
      tenantsGrowth,
    };
  }

  private buildTenantsGrowth(
    tenants: Tenant[],
  ): { month: string; count: number }[] {
    const now = new Date();
    const months: { month: string; count: number; year: number; monthIndex: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: SPANISH_MONTH_LABELS[date.getMonth()],
        count: 0,
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
      });
    }

    for (const tenant of tenants) {
      const created = tenant.createdAt;
      const bucket = months.find(
        (m) => m.year === created.getFullYear() && m.monthIndex === created.getMonth(),
      );
      if (bucket) bucket.count += 1;
    }

    return months.map(({ month, count }) => ({ month, count }));
  }
}
