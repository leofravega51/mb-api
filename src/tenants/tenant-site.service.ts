import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@/common/constants';
import {
  assertValidTenantSlug,
  isReservedTenantSlug,
  normalizeTenantSlug,
} from '@/common/utils/validate-tenant-slug';
import { TENANT_SLUG_PATTERN } from '@/common/constants/reserved-slugs';
import { buildTenantSiteUrl } from '@/common/utils/build-site-url';
import { TenantRepository } from '@/tenants/tenant.repository';

export interface TenantSiteDto {
  name: string;
  slug: string;
  siteUrl: string;
}

@Injectable()
export class TenantSiteService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly config: ConfigService,
  ) {}

  async getSite(tenantId: string): Promise<TenantSiteDto> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) throw new ForbiddenException('Tenant no encontrado');

    return this.toDto(tenant.name, tenant.slug);
  }

  async updateSite(
    tenantId: string,
    rawSlug: string,
    actorRole: string,
  ): Promise<TenantSiteDto> {
    if (actorRole !== UserRole.OWNER && actorRole !== UserRole.ADMIN) {
      throw new ForbiddenException('No tenés permiso para configurar el sitio');
    }

    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) throw new ForbiddenException('Tenant no encontrado');

    const slug = assertValidTenantSlug(rawSlug);
    if (slug !== tenant.slug && (await this.tenantRepository.slugExists(slug))) {
      throw new ConflictException('Este identificador ya está en uso');
    }

    tenant.slug = slug;
    const saved = await this.tenantRepository.save(tenant);
    return this.toDto(saved.name, saved.slug);
  }

  async isSlugAvailable(
    rawSlug: string,
    excludeTenantId?: string,
  ): Promise<{ slug: string; available: boolean }> {
    const slug = normalizeTenantSlug(rawSlug);
    if (
      !slug ||
      slug.length < 2 ||
      !TENANT_SLUG_PATTERN.test(slug) ||
      isReservedTenantSlug(slug)
    ) {
      return { slug, available: false };
    }

    const existing = await this.tenantRepository.findBySlug(slug);
    const available = !existing || existing.id === excludeTenantId;
    return { slug, available };
  }

  private toDto(name: string, slug: string): TenantSiteDto {
    return {
      name,
      slug,
      siteUrl: buildTenantSiteUrl(slug, this.config),
    };
  }
}
