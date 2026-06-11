import { Injectable } from '@nestjs/common';
import { PlanRepository } from './plan.repository';

export interface CatalogPlanDto {
  id: string;
  name: string;
  priceMonthly: number;
  maxTeamSeats: number;
  maxProducts: number;
  features: string[];
}

@Injectable()
export class PlansCatalogService {
  constructor(private readonly planRepository: PlanRepository) {}

  async listCatalog(): Promise<{ plans: CatalogPlanDto[] }> {
    const plans = await this.planRepository.findAll();
    return {
      plans: plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        priceMonthly: Number(plan.priceMonthly),
        maxTeamSeats: plan.maxTeamSeats,
        maxProducts: plan.maxProducts,
        features: plan.features ?? [],
      })),
    };
  }
}
