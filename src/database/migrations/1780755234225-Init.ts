import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1780755234225 implements MigrationInterface {
  name = 'Init1780755234225';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      telegram_id BIGINT NOT NULL UNIQUE,
      telegram_username VARCHAR(255) NULL,
      name VARCHAR(100) NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS images (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(100) NOT NULL,
      original_name VARCHAR(500) NOT NULL,
      size INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      key VARCHAR(50) NOT NULL UNIQUE,
      label VARCHAR(100) NOT NULL
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      category_id INT NULL REFERENCES categories(id) ON DELETE SET NULL,
      price DECIMAL(10,2) NOT NULL,
      double_price DECIMAL(10,2) NULL,
      rating DECIMAL(2,1) NOT NULL DEFAULT 0,
      image_id INT NULL REFERENCES images(id) ON DELETE SET NULL,
      description TEXT NOT NULL DEFAULT '',
      badge VARCHAR(50) NULL,
      brand VARCHAR(100) NOT NULL DEFAULT '',
      variant_label VARCHAR(50) NULL,
      visible BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS product_variants (
      id SERIAL PRIMARY KEY,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      value VARCHAR(100) NOT NULL,
      stock INT NOT NULL
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS product_colors (
      id SERIAL PRIMARY KEY,
      product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      hex VARCHAR(7) NOT NULL,
      stock INT NOT NULL
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES products(id),
      quantity INT NOT NULL,
      variant_key VARCHAR(100) NULL,
      UNIQUE (user_id, product_id, variant_key)
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS wishlist_items (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES products(id),
      UNIQUE (user_id, product_id)
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS addresses (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id),
      label VARCHAR(100) NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id),
      total DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'sent',
      delivery_method VARCHAR(20) NOT NULL,
      comment TEXT NULL,
      address_id INT NULL REFERENCES addresses(id),
      delivery_time VARCHAR(10) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INT NOT NULL,
      product_name VARCHAR(200) NOT NULL,
      product_image VARCHAR(500) NOT NULL,
      variant_key VARCHAR(100) NULL,
      variant_name VARCHAR(100) NULL,
      quantity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS rates (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id),
      product_id INT NOT NULL REFERENCES products(id),
      value INT NOT NULL CHECK (value >= 1 AND value <= 5),
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      UNIQUE (user_id, product_id)
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS story_sets (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      image_id INT NULL REFERENCES images(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now(),
      updated_at TIMESTAMP NOT NULL DEFAULT now()
    )`);

    await queryRunner.query(`CREATE TABLE IF NOT EXISTS stories (
      id SERIAL PRIMARY KEY,
      image_id INT NULL REFERENCES images(id) ON DELETE SET NULL,
      duration INT NOT NULL DEFAULT 3000,
      title VARCHAR(255) NULL,
      subtitle VARCHAR(255) NULL,
      story_set_id INT NOT NULL REFERENCES story_sets(id) ON DELETE CASCADE,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS stories`);
    await queryRunner.query(`DROP TABLE IF EXISTS story_sets`);
    await queryRunner.query(`DROP TABLE IF EXISTS rates`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS orders`);
    await queryRunner.query(`DROP TABLE IF EXISTS addresses`);
    await queryRunner.query(`DROP TABLE IF EXISTS wishlist_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS cart_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_colors`);
    await queryRunner.query(`DROP TABLE IF EXISTS product_variants`);
    await queryRunner.query(`DROP TABLE IF EXISTS products`);
    await queryRunner.query(`DROP TABLE IF EXISTS categories`);
    await queryRunner.query(`DROP TABLE IF EXISTS images`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
  }
}
