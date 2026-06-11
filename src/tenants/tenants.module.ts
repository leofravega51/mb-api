import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '@/database/entities/tenant.entity';
import { TenantRepository } from './tenant.repository';
import { PlansModule } from '@/plans/plans.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant]), PlansModule],
  providers: [TenantRepository],
  exports: [TenantRepository, PlansModule],
})
export class TenantsModule {}
