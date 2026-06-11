import { BadRequestException } from '@nestjs/common';
import {
  RESERVED_TENANT_SLUGS,
  TENANT_SLUG_PATTERN,
} from '@/common/constants/reserved-slugs';
import { slugify } from '@/common/utils/slugify';

export function normalizeTenantSlug(value: string): string {
  return slugify(value);
}

export function isReservedTenantSlug(slug: string): boolean {
  return RESERVED_TENANT_SLUGS.has(slug);
}

export function assertValidTenantSlug(raw: string): string {
  const slug = normalizeTenantSlug(raw);
  if (!slug || slug.length < 2) {
    throw new BadRequestException('Identificador inválido (mínimo 2 caracteres)');
  }
  if (!TENANT_SLUG_PATTERN.test(slug)) {
    throw new BadRequestException(
      'Identificador inválido (solo minúsculas, números y guiones)',
    );
  }
  if (isReservedTenantSlug(slug)) {
    throw new BadRequestException('Este identificador está reservado');
  }
  return slug;
}
