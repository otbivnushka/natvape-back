import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryAndProductAttributes1783436672038 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "category_attributes" (
                "id" SERIAL NOT NULL,
                "category_id" integer NOT NULL,
                "name" character varying(100) NOT NULL,
                "key" character varying(100) NOT NULL,
                "type" character varying(20) NOT NULL,
                "required" boolean NOT NULL DEFAULT false,
                CONSTRAINT "PK_category_attributes" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "product_attributes" (
                "id" SERIAL NOT NULL,
                "product_id" integer NOT NULL,
                "attribute_id" integer NOT NULL,
                "value" character varying(255) NOT NULL,
                CONSTRAINT "PK_product_attributes" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`ALTER TABLE "category_attributes" DROP CONSTRAINT IF EXISTS "FK_category_attributes_category"`);
        await queryRunner.query(`ALTER TABLE "category_attributes" ADD CONSTRAINT "FK_category_attributes_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id")`);
        await queryRunner.query(`ALTER TABLE "product_attributes" DROP CONSTRAINT IF EXISTS "FK_product_attributes_product"`);
        await queryRunner.query(`ALTER TABLE "product_attributes" ADD CONSTRAINT "FK_product_attributes_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_attributes" DROP CONSTRAINT IF EXISTS "FK_product_attributes_attribute"`);
        await queryRunner.query(`ALTER TABLE "product_attributes" ADD CONSTRAINT "FK_product_attributes_attribute" FOREIGN KEY ("attribute_id") REFERENCES "category_attributes"("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_attributes" DROP CONSTRAINT IF EXISTS "FK_product_attributes_attribute"`);
        await queryRunner.query(`ALTER TABLE "product_attributes" DROP CONSTRAINT IF EXISTS "FK_product_attributes_product"`);
        await queryRunner.query(`ALTER TABLE "category_attributes" DROP CONSTRAINT IF EXISTS "FK_category_attributes_category"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "product_attributes"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "category_attributes"`);
    }

}
