import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { PlansCatalogService } from './plans-catalog.service';

@Controller('plans')
@UseGuards(AuthGuard('jwt'), TenantGuard)
export class PlansCatalogController {
  constructor(private readonly plansCatalogService: PlansCatalogService) {}

  @Get()
  list() {
    return this.plansCatalogService.listCatalog();
  }
}
