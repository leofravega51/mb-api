import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '@/database/entities/tenant.entity';
import { Plan } from '@/database/entities/plan.entity';
import { UserRepository } from '@/users/domain/repositories/user.repository';
import { assertValidTenantSlug } from '@/common/utils/validate-tenant-slug';
import type { TenantSummaryDto } from '@/admin/interfaces/admin.interfaces';
import { UpdateTenantDto } from '@/admin/dto/update-tenant.dto';

@Injectable()
export class AdminTenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    private readonly userRepository: UserRepository,
  ) {}

  async listTenants(): Promise<{ tenants: TenantSummaryDto[] }> {
    const tenants = await this.tenantRepo.find({
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });

    const summaries = await Promise.all(
      tenants.map(async (tenant) => this.toSummary(tenant)),
    );

    return { tenants: summaries };
  }

  async updateTenant(id: string, dto: UpdateTenantDto): Promise<{ tenant: TenantSummaryDto }> {
    const tenant = await this.tenantRepo.findOne({
      where: { id },
      relations: ['plan'],
    });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    if (dto.name !== undefined) {
      tenant.name = dto.name.trim();
    }

    if (dto.slug !== undefined) {
      const slug = assertValidTenantSlug(dto.slug);

      const existing = await this.tenantRepo.findOne({ where: { slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException('El slug ya está en uso');
      }
      tenant.slug = slug;
    }

    if (dto.plan !== undefined) {
      const plan = await this.planRepo.findOne({ where: { id: dto.plan } });
      if (!plan) throw new BadRequestException('Plan no válido');
      tenant.planId = dto.plan;
      tenant.plan = plan;
    }

    if (dto.status !== undefined) {
      tenant.status = dto.status;
    }

    if (dto.trialEndsAt !== undefined) {
      tenant.trialEndsAt = dto.trialEndsAt ? new Date(dto.trialEndsAt) : null;
    }

    const saved = await this.tenantRepo.save(tenant);
    const withPlan = await this.tenantRepo.findOne({
      where: { id: saved.id },
      relations: ['plan'],
    });

    return { tenant: await this.toSummary(withPlan ?? saved) };
  }

  async deleteTenant(id: string): Promise<{ ok: true; deletedId: string }> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant no encontrado');

    await this.tenantRepo.remove(tenant);
    return { ok: true, deletedId: id };
  }

  private async toSummary(tenant: Tenant): Promise<TenantSummaryDto> {
    const userCount = await this.userRepository.countStaffByTenantId(tenant.id);
    const ownerEmail =
      (await this.userRepository.findOwnerEmailByTenantId(tenant.id)) ?? '';

    const plan =
      tenant.plan ??
      (await this.planRepo.findOne({ where: { id: tenant.planId } }));

    const mrr =
      tenant.status === 'active' && plan ? Number(plan.priceMonthly) : 0;

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.planId,
      status: tenant.status,
      ownerEmail,
      userCount,
      createdAt: tenant.createdAt.toISOString(),
      trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
      mrr,
    };
  }
}
