import { UNLIMITED_PLAN_QUOTA } from '@/common/constants';

export interface PlanQuotaUsage {
  maxTeamSeats: number;
  maxProducts: number;
  usedTeamSeats: number;
  usedProducts: number;
  teamSeatsRemaining: number | null;
  productsRemaining: number | null;
}

export function isUnlimitedQuota(value: number): boolean {
  return value === UNLIMITED_PLAN_QUOTA;
}

export function remainingQuota(max: number, used: number): number | null {
  if (isUnlimitedQuota(max)) return null;
  return Math.max(0, max - used);
}

export function canAddWithinQuota(max: number, used: number): boolean {
  if (isUnlimitedQuota(max)) return true;
  return used < max;
}

export function buildPlanQuotaUsage(
  maxTeamSeats: number,
  maxProducts: number,
  usedTeamSeats: number,
  usedProducts: number,
): PlanQuotaUsage {
  return {
    maxTeamSeats,
    maxProducts,
    usedTeamSeats,
    usedProducts,
    teamSeatsRemaining: remainingQuota(maxTeamSeats, usedTeamSeats),
    productsRemaining: remainingQuota(maxProducts, usedProducts),
  };
}
