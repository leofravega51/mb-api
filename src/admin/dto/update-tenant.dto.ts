import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
} from 'class-validator';
import type { PlanId, TenantStatus } from '@/common/constants';

const PLAN_IDS: PlanId[] = ['trial', 'starter', 'pro', 'enterprise'];
const TENANT_STATUSES: TenantStatus[] = ['active', 'trial', 'suspended', 'cancelled'];

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones',
  })
  slug?: string;

  @IsOptional()
  @IsIn(PLAN_IDS)
  plan?: PlanId;

  @IsOptional()
  @IsIn(TENANT_STATUSES)
  status?: TenantStatus;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsISO8601()
  trialEndsAt?: string | null;
}
