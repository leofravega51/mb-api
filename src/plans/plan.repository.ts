import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from '@/database/entities/plan.entity';
import type { PlanId } from '@/common/constants';
import { DEFAULT_PLAN_CATALOG } from '@/common/constants';

@Injectable()
export class PlanRepository {
  constructor(
    @InjectRepository(Plan)
    private readonly repo: Repository<Plan>,
  ) {}

  async findById(id: PlanId): Promise<Plan | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(): Promise<Plan[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  /** Catálogo mínimo para onboarding self-service (plan Free/Trial). */
  async ensureTrialPlan(): Promise<Plan> {
    const existing = await this.findById('trial');
    if (existing) return existing;

    const defaults = DEFAULT_PLAN_CATALOG.trial;
    const plan = this.repo.create({
      id: 'trial',
      name: defaults.name,
      priceMonthly: String(defaults.priceMonthly),
      maxTeamSeats: defaults.maxTeamSeats,
      maxProducts: defaults.maxProducts,
      features: defaults.features,
    });
    return this.repo.save(plan);
  }
}
