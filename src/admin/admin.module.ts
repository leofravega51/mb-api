import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { PlatformAdmin, Plan, Tenant } from '@/database/entities';
import { UsersModule } from '@/users/users.module';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { AdminMetricsController } from './controllers/admin-metrics.controller';
import { AdminTenantsController } from './controllers/admin-tenants.controller';
import { AdminPlansController } from './controllers/admin-plans.controller';
import { AdminAuthService } from './services/admin-auth.service';
import { AdminMetricsService } from './services/admin-metrics.service';
import { AdminTenantsService } from './services/admin-tenants.service';
import { AdminPlansService } from './services/admin-plans.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { JwtAdminGuard } from './guards/jwt-admin.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'admin-jwt' }),
    TypeOrmModule.forFeature([PlatformAdmin, Plan, Tenant]),
    UsersModule,
  ],
  controllers: [
    AdminAuthController,
    AdminMetricsController,
    AdminTenantsController,
    AdminPlansController,
  ],
  providers: [
    AdminAuthService,
    AdminMetricsService,
    AdminTenantsService,
    AdminPlansService,
    AdminJwtStrategy,
    JwtAdminGuard,
  ],
})
export class AdminModule {}
