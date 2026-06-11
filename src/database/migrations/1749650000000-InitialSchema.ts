import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1749650000000 implements MigrationInterface {
  name = 'InitialSchema1749650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "platform_admins" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "name" character varying NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_platform_admins_email" UNIQUE ("email"),
        CONSTRAINT "PK_platform_admins" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "plans" (
        "id" character varying(32) NOT NULL,
        "name" character varying NOT NULL,
        "price_monthly" numeric(10,2) NOT NULL DEFAULT 0,
        "max_users" integer NOT NULL DEFAULT 0,
        "max_products" integer NOT NULL DEFAULT 0,
        "features" jsonb NOT NULL DEFAULT '[]',
        CONSTRAINT "PK_plans" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "slug" character varying NOT NULL,
        "plan_id" character varying(32) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'trial',
        "trial_ends_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tenants_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id"),
        CONSTRAINT "FK_tenants_plan" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid,
        "email" character varying NOT NULL,
        "password_hash" character varying,
        "name" character varying NOT NULL,
        "phone" character varying,
        "role" character varying(64) NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "reset_password_token" character varying,
        "reset_password_expires" TIMESTAMP WITH TIME ZONE,
        "address" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_tenant_email" ON "users" ("tenant_id", "email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_users_tenant_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(`DROP TABLE "plans"`);
    await queryRunner.query(`DROP TABLE "platform_admins"`);
  }
}
