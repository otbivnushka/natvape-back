import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeAddressUserIdNullable1781021490143 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "addresses" ALTER COLUMN "user_id" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "addresses" ALTER COLUMN "user_id" SET NOT NULL`,
    );
  }
}
