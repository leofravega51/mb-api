import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '@/database/entities/tenant.entity';
import { TenantRepository } from './tenant.repository';
import { TenantSiteService } from './tenant-site.service';
import { TenantSiteController } from './tenant-site.controller';
import { PlansModule } from '@/plans/plans.module';
import { RoleModule } from '@/role/role.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant]), PlansModule, RoleModule],
  controllers: [TenantSiteController],
  providers: [TenantRepository, TenantSiteService],
  exports: [TenantRepository, TenantSiteService, PlansModule],
})
export class TenantsModule {}
