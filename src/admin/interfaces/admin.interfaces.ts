import type { PlanId, TenantStatus } from '@/common/constants';

export interface PlatformAdminDto {
  id: string;
  email: string;
  name: string;
}

export interface PlatformPlanDto {
  id: PlanId;
  name: string;
  priceMonthly: number;
  maxTeamSeats: number;
  maxProducts: number;
  features: string[];
  tenantCount: number;
}

export interface TenantSummaryDto {
  id: string;
  name: string;
  slug: string;
  plan: PlanId;
  status: TenantStatus;
  ownerEmail: string;
  userCount: number;
  createdAt: string;
  trialEndsAt: string | null;
  mrr: number;
}

export interface PlatformMetricsDto {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  totalMrr: number;
  totalRevenue: number;
  revenueByPlan: { plan: string; revenue: number; count: number }[];
  tenantsGrowth: { month: string; count: number }[];
}
