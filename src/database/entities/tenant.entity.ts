import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import type { PlanId, TenantStatus } from '@/common/constants';
import { Plan } from './plan.entity';
import { User } from './user.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', unique: true })
  slug!: string;

  @Column({ name: 'plan_id', type: 'varchar', length: 32 })
  planId!: PlanId;

  @ManyToOne(() => Plan, (plan) => plan.tenants)
  @JoinColumn({ name: 'plan_id' })
  plan!: Plan;

  @Column({ type: 'varchar', length: 32, default: 'trial' })
  status!: TenantStatus;

  @Column({ name: 'trial_ends_at', type: 'timestamptz', nullable: true })
  trialEndsAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => User, (user) => user.tenant)
  users!: User[];
}
