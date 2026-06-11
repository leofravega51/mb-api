import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPermissionsGuard } from '@/common/guards/jwt-permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RequiredPermission } from '@/role/infrastructure/decorators/required-permission.decorator';
import { Permission } from '@/role/domain/models';
import { CurrentUser, JwtPayload } from '@/common/decorators/current-user.decorator';
import { CurrentTenantId } from '@/common/decorators/current-tenant.decorator';
import { TenantSiteService } from '@/tenants/tenant-site.service';
import { UpdateTenantSiteDto } from '@/tenants/dto/update-tenant-site.dto';

@Controller('tenant/site')
@UseGuards(AuthGuard('jwt'), JwtPermissionsGuard, TenantGuard)
export class TenantSiteController {
  constructor(private readonly tenantSiteService: TenantSiteService) {}

  @Get()
  @RequiredPermission(Permission.SEE_PROFILE)
  getSite(@CurrentTenantId() tenantId: string) {
    return this.tenantSiteService.getSite(tenantId);
  }

  @Patch()
  @RequiredPermission(Permission.SEE_PROFILE)
  updateSite(
    @CurrentTenantId() tenantId: string,
    @Body() dto: UpdateTenantSiteDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.tenantSiteService.updateSite(
      tenantId,
      dto.slug,
      actor.role ?? '',
    );
  }
}
