import { MigrationInterface, QueryRunner } from "typeorm";

export class AddActualPriceToOrders1786467573398 implements MigrationInterface {
    name = 'AddActualPriceToOrders1786467573398';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_price DECIMAL(10,2) NULL`);
        await queryRunner.query(`UPDATE orders SET actual_price = total WHERE actual_price IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE orders DROP COLUMN actual_price`);
    }
}
