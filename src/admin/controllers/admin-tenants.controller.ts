import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAdminGuard } from '@/admin/guards/jwt-admin.guard';
import { AdminTenantsService } from '@/admin/services/admin-tenants.service';
import { UpdateTenantDto } from '@/admin/dto/update-tenant.dto';

@Controller('admin/tenants')
@UseGuards(JwtAdminGuard)
export class AdminTenantsController {
  constructor(private readonly adminTenantsService: AdminTenantsService) {}

  @Get()
  listTenants() {
    return this.adminTenantsService.listTenants();
  }

  @Patch(':id')
  updateTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.adminTenantsService.updateTenant(id, dto);
  }

  @Delete(':id')
  deleteTenant(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminTenantsService.deleteTenant(id);
  }
}
