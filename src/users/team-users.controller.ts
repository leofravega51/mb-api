import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPermissionsGuard } from '@/common/guards/jwt-permissions.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RequiredPermission } from '@/role/infrastructure/decorators/required-permission.decorator';
import { Permission } from '@/role/domain/models';
import { CurrentUser, JwtPayload } from '@/common/decorators/current-user.decorator';
import { CurrentTenantId } from '@/common/decorators/current-tenant.decorator';
import { TeamUsersService } from '@/users/team-users.service';
import { CreateTeamUserDto, UpdateTeamUserDto } from '@/users/dto/team-user.dto';

@Controller('users/team')
@UseGuards(AuthGuard('jwt'), JwtPermissionsGuard, TenantGuard)
export class TeamUsersController {
  constructor(private readonly teamUsersService: TeamUsersService) {}

  @Get()
  @RequiredPermission(Permission.MANAGE_USERS)
  list(@CurrentTenantId() tenantId: string) {
    return this.teamUsersService.list(tenantId);
  }

  @Post()
  @RequiredPermission(Permission.MANAGE_USERS)
  create(
    @CurrentTenantId() tenantId: string,
    @Body() dto: CreateTeamUserDto,
  ) {
    return this.teamUsersService.create(tenantId, dto);
  }

  @Patch(':id')
  @RequiredPermission(Permission.MANAGE_USERS)
  update(
    @CurrentTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamUserDto,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.teamUsersService.update(tenantId, id, dto, actor.role ?? '');
  }

  @Delete(':id')
  @RequiredPermission(Permission.MANAGE_USERS)
  remove(
    @CurrentTenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: JwtPayload,
  ) {
    return this.teamUsersService.remove(tenantId, id, actor.sub);
  }
}
