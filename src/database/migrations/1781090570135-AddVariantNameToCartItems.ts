import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVariantNameToCartItems1781090570135 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cart_items" ADD "variant_name" varchar(100) DEFAULT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cart_items" DROP COLUMN "variant_name"`);
    }

}
