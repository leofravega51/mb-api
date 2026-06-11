export const COOKIE_NAME = 'access_token';
export const ADMIN_COOKIE_NAME = 'admin_token';

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  SELLER = 'seller',
  DELIVERY = 'delivery',
  /** Comprador del tenant — no consume asiento de equipo */
  CLIENT = 'client',
}

/** Roles que acceden al panel y consumen asiento del plan */
export const STAFF_ROLES: UserRole[] = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.SELLER,
  UserRole.DELIVERY,
];

export function isStaffRole(role: string): boolean {
  return STAFF_ROLES.includes(role as UserRole);
}

export type PlanId = 'trial' | 'starter' | 'pro' | 'enterprise';
export type TenantStatus = 'active' | 'trial' | 'suspended' | 'cancelled';

/** -1 significa ilimitado */
export const UNLIMITED_PLAN_QUOTA = -1;

export const SPANISH_MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

export const DEFAULT_PLAN_CATALOG: Record<
  PlanId,
  {
    name: string;
    priceMonthly: number;
    maxTeamSeats: number;
    maxProducts: number;
    features: string[];
  }
> = {
  trial: {
    name: 'Free',
    priceMonthly: 0,
    maxTeamSeats: 2,
    maxProducts: 200,
    features: ['200 productos', '2 usuarios de equipo', 'Pedidos ilimitados'],
  },
  starter: {
    name: 'Starter',
    priceMonthly: 29,
    maxTeamSeats: 5,
    maxProducts: 500,
    features: ['500 productos', '5 usuarios de equipo', 'Pedidos ilimitados'],
  },
  pro: {
    name: 'Pro',
    priceMonthly: 79,
    maxTeamSeats: 15,
    maxProducts: 1000,
    features: ['1000 productos', '15 usuarios de equipo', 'Pedidos ilimitados'],
  },
  enterprise: {
    name: 'Custom',
    priceMonthly: 199,
    maxTeamSeats: UNLIMITED_PLAN_QUOTA,
    maxProducts: UNLIMITED_PLAN_QUOTA,
    features: ['Productos ilimitados', 'Equipo ilimitado', 'SLA dedicado'],
  },
};
