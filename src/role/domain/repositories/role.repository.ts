import { Injectable } from '@nestjs/common';
import { UserRole } from '@/common/constants';
import { Permission, type Role } from '@/role/domain/models';

const SYSTEM_ROLES: Role[] = [
  {
    id: 'role-owner',
    key: UserRole.OWNER,
    name: 'Owner',
    permissions: [
      Permission.SEE_PROFILE,
      Permission.MANAGE_USERS,
      Permission.MANAGE_PRODUCTS,
    ],
  },
  {
    id: 'role-admin',
    key: UserRole.ADMIN,
    name: 'Admin',
    permissions: [
      Permission.SEE_PROFILE,
      Permission.MANAGE_USERS,
      Permission.MANAGE_PRODUCTS,
    ],
  },
  {
    id: 'role-seller',
    key: UserRole.SELLER,
    name: 'Vendedor',
    permissions: [Permission.SEE_PROFILE, Permission.MANAGE_PRODUCTS],
  },
  {
    id: 'role-delivery',
    key: UserRole.DELIVERY,
    name: 'Delivery',
    permissions: [Permission.SEE_PROFILE],
  },
  {
    id: 'role-client',
    key: UserRole.CLIENT,
    name: 'Cliente',
    permissions: [Permission.SEE_PROFILE],
  },
];

@Injectable()
export class RoleRepository {
  async findAll(): Promise<Role[]> {
    return SYSTEM_ROLES;
  }

  async findById(id: string): Promise<Role | null> {
    return SYSTEM_ROLES.find((r) => r.id === id) ?? null;
  }

  async findByKey(key: string): Promise<Role | null> {
    return SYSTEM_ROLES.find((r) => r.key === key) ?? null;
  }

  async listStaffRoles(): Promise<Role[]> {
    return SYSTEM_ROLES.filter(
      (r) =>
        r.key === UserRole.ADMIN ||
        r.key === UserRole.SELLER ||
        r.key === UserRole.DELIVERY,
    );
  }
}
