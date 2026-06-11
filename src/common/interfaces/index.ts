export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  permissions?: string[];
  tenantId?: string;
}

export interface AdminJwtPayload {
  sub: string;
  email: string;
  name: string;
}
