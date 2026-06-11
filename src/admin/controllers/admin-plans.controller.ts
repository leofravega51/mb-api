import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAdminGuard } from '@/admin/guards/jwt-admin.guard';
import { AdminPlansService } from '@/admin/services/admin-plans.service';

@Controller('admin/plans')
@UseGuards(JwtAdminGuard)
export class AdminPlansController {
  constructor(private readonly adminPlansService: AdminPlansService) {}

  @Get()
  listPlans() {
    return this.adminPlansService.listPlans();
  }
}
