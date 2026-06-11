import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameMaxUsersToMaxTeamSeats1749651000000 implements MigrationInterface {
  name = 'RenameMaxUsersToMaxTeamSeats1749651000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plans"
      RENAME COLUMN "max_users" TO "max_team_seats"
    `);

    await queryRunner.query(`
      UPDATE "plans" SET
        "max_products" = 200,
        "max_team_seats" = 2,
        "name" = 'Free',
        "features" = '["200 productos", "2 usuarios de equipo", "Pedidos ilimitados"]'::jsonb
      WHERE "id" = 'trial'
    `);

    await queryRunner.query(`
      INSERT INTO "plans" ("id", "name", "price_monthly", "max_team_seats", "max_products", "features")
      VALUES
        ('starter', 'Starter', 29, 5, 500, '["500 productos", "5 usuarios de equipo", "Pedidos ilimitados"]'::jsonb),
        ('pro', 'Pro', 79, 15, 1000, '["1000 productos", "15 usuarios de equipo", "Pedidos ilimitados"]'::jsonb),
        ('enterprise', 'Custom', 199, -1, -1, '["Productos ilimitados", "Equipo ilimitado", "SLA dedicado"]'::jsonb)
      ON CONFLICT ("id") DO UPDATE SET
        "max_team_seats" = EXCLUDED."max_team_seats",
        "max_products" = EXCLUDED."max_products",
        "features" = EXCLUDED."features"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "plans"
      RENAME COLUMN "max_team_seats" TO "max_users"
    `);
  }
}
