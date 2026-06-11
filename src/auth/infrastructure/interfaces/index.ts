import type { PlanId, TenantStatus } from '@/common/constants';

/** Dirección del usuario (para perfil y sesión). */
export interface SessionUserAddress {
  street?: string;
  zipCode?: string;
  addressDisplayText?: string;
  latitude?: number;
  longitude?: number;
}

export interface PlanQuotaUsageDto {
  maxTeamSeats: number;
  maxProducts: number;
  usedTeamSeats: number;
  usedProducts: number;
  teamSeatsRemaining: number | null;
  productsRemaining: number | null;
}

export interface SessionTenant {
  id: string;
  name: string;
  slug: string;
  plan: PlanId;
  status: TenantStatus;
  trialEndsAt: string | null;
  usage: PlanQuotaUsageDto;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  permissions: string[];
  tenantId?: string | null;
  address?: SessionUserAddress | null;
}

export interface SessionResponse {
  user: SessionUser;
  tenant: SessionTenant | null;
}

export interface ResolveTenantResponse {
  tenantId: string;
  name: string;
  slug: string;
}
