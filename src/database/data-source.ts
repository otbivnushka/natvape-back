import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from '../common/naming-strategy';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({
  path: join(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
  override: true,
});

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'natvape',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  namingStrategy: new SnakeNamingStrategy(),
});
