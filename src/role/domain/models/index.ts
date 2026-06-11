export enum Permission {
  SEE_PROFILE = 'see_profile',
  MANAGE_USERS = 'manage_users',
  MANAGE_PRODUCTS = 'manage_products',
}

export interface Role {
  id: string;
  key: string;
  name: string;
  permissions: string[];
}
