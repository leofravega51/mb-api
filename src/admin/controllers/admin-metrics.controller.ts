import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAdminGuard } from '@/admin/guards/jwt-admin.guard';
import { AdminMetricsService } from '@/admin/services/admin-metrics.service';

@Controller('admin/metrics')
@UseGuards(JwtAdminGuard)
export class AdminMetricsController {
  constructor(private readonly adminMetricsService: AdminMetricsService) {}

  @Get()
  getMetrics() {
    return this.adminMetricsService.getMetrics();
  }
}
