import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBonusSystem1789000000000 implements MigrationInterface {
  name = 'AddBonusSystem1789000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "bonus_transactions" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "amount" NUMERIC(10,2) NOT NULL,
        "type" VARCHAR(20) NOT NULL,
        "order_id" INTEGER REFERENCES "orders"("id") ON DELETE SET NULL,
        "description" VARCHAR(255),
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "orders" ADD COLUMN "bonus_used" INTEGER NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "orders" ADD COLUMN "bonus_accrued" NUMERIC(10,2) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "bonus_accrued"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "bonus_used"`);
    await queryRunner.query(`DROP TABLE "bonus_transactions"`);
  }
}
