import { Client } from 'pg';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`), override: true });
import { Category } from './categories/entities/category.entity';
import { Product } from './products/entities/product.entity';
import { ProductVariant } from './products/entities/product-variant.entity';
import { ProductColor } from './products/entities/product-color.entity';
import { User } from './users/entities/user.entity';
import { Address } from './addresses/entities/address.entity';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { categoriesData, productsData } from './data/products';

async function dropAllTables() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'natvape',
  });
  await client.connect();
  await client.query(`
    DROP TABLE IF EXISTS
      cart_items, wishlist_items, order_items, orders, addresses,
      product_variants, product_colors, products, categories, users,
      images, rates
    CASCADE
  `);
  await client.end();
}

async function seed() {
  await dropAllTables();

  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.startTransaction();

    const categoryMap = new Map<string, Category>();
    for (const catData of categoriesData) {
      const saved = await queryRunner.manager.save(Category, catData);
      categoryMap.set(saved.key, saved);
    }

    for (const prodData of productsData) {
      const { categoryKey, variants, colors, ...productFields } = prodData;
      const category = categoryMap.get(categoryKey);
      if (!category) continue;

      const savedProduct = await queryRunner.manager.save(Product, {
        ...productFields,
        categoryId: category.id,
      });

      for (const v of variants) {
        await queryRunner.manager.save(ProductVariant, {
          productId: savedProduct.id,
          ...v,
        });
      }

      for (const c of colors) {
        await queryRunner.manager.save(ProductColor, {
          productId: savedProduct.id,
          ...c,
        });
      }
    }

    const savedUser = await queryRunner.manager.save(User, {
      name: 'Максим Волков',
      telegramId: 123456789,
      telegramUsername: 'maxvolkov',
      isAdmin: true,
    });

    const address1 = await queryRunner.manager.save(Address, {
      userId: savedUser.id,
      label: 'Дом',
      lat: 55.1940486,
      lng: 30.1124937,
    });

    const address2 = await queryRunner.manager.save(Address, {
      userId: savedUser.id,
      label: 'Работа',
      lat: 55.2940486,
      lng: 30.1124937,
    });

    const address3 = await queryRunner.manager.save(Address, {
      userId: savedUser.id,
      label: 'Родители',
      lat: 55.0940486,
      lng: 30.1124937,
    });

    const savedOrder1 = await queryRunner.manager.save(Order, {
      userId: savedUser.id,
      total: 49,
      status: 'end',
      deliveryMethod: 'pickup',
      addressId: address1.id,
      deliveryTime: '14:00',
      createdAt: new Date('2026-04-15T10:00:00Z'),
    });

    await queryRunner.manager.save(OrderItem, {
      orderId: savedOrder1.id,
      productId: 1,
      productName: 'Жидкость Bubble Gum 50ml',
      productImage:
        'https://placehold.co/400x400/1a1a2e/e94560?text=Bubble+Gum',
      variantKey: 'cherry',
      variantName: 'Вишня',
      quantity: 2,
      price: 24.5,
    });

    const savedOrder2 = await queryRunner.manager.save(Order, {
      userId: savedUser.id,
      total: 75,
      status: 'sent',
      deliveryMethod: 'delivery',
      comment: 'Позвонить перед выходом',
      addressId: address2.id,
      deliveryTime: '15:00',
      createdAt: new Date('2026-05-10T10:00:00Z'),
    });

    await queryRunner.manager.save(OrderItem, {
      orderId: savedOrder2.id,
      productId: 3,
      productName: 'Жидкость Tropical Fruits 60ml',
      productImage: 'https://placehold.co/400x400/1a1a2e/e94560?text=Tropical',
      variantKey: 'mango',
      variantName: 'Манго',
      quantity: 1,
      price: 30,
    });

    const savedOrder3 = await queryRunner.manager.save(Order, {
      userId: savedUser.id,
      total: 159,
      status: 'sent',
      deliveryMethod: 'pickup',
      addressId: address3.id,
      deliveryTime: '16:00',
      createdAt: new Date('2026-05-24T10:00:00Z'),
    });

    await queryRunner.manager.save(OrderItem, {
      orderId: savedOrder3.id,
      productId: 16,
      productName: 'Под Vaporesso XROS 3',
      productImage: 'https://placehold.co/400x400/16213e/0f3460?text=XROS+3',
      quantity: 1,
      price: 45,
    });

    await queryRunner.manager.save(OrderItem, {
      orderId: savedOrder3.id,
      productId: 1,
      productName: 'Жидкость Bubble Gum 50ml',
      productImage:
        'https://placehold.co/400x400/1a1a2e/e94560?text=Bubble+Gum',
      variantKey: 'apple',
      variantName: 'Яблоко',
      quantity: 3,
      price: 25,
    });

    await queryRunner.commitTransaction();
    console.log('Seed completed successfully!');
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error('Seed failed:', err);
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

void seed();
