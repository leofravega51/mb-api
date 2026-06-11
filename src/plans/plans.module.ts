import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from '@/database/entities/plan.entity';
import { Tenant } from '@/database/entities/tenant.entity';
import { UsersModule } from '@/users/users.module';
import { PlanRepository } from './plan.repository';
import { PlanLimitsService } from './plan-limits.service';
import { PlansCatalogService } from './plans-catalog.service';
import { PlansCatalogController } from './plans-catalog.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plan, Tenant]),
    forwardRef(() => UsersModule),
  ],
  controllers: [PlansCatalogController],
  providers: [PlanRepository, PlanLimitsService, PlansCatalogService],
  exports: [PlanRepository, PlanLimitsService, PlansCatalogService],
})
export class PlansModule {}
