import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import type { PlanId } from '@/common/constants';
import { Tenant } from './tenant.entity';

@Entity('plans')
export class Plan {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id!: PlanId;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ name: 'price_monthly', type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceMonthly!: string;

  @Column({ name: 'max_team_seats', type: 'int', default: 0 })
  maxTeamSeats!: number;

  @Column({ name: 'max_products', type: 'int', default: 0 })
  maxProducts!: number;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  features!: string[];

  @OneToMany(() => Tenant, (tenant) => tenant.plan)
  tenants!: Tenant[];
}
