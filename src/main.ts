import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('NatVape API')
    .setDescription('Backend for NatVape Telegram Mini App')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');

  const dataSource = app.get(DataSource);
  const sqlPath = join(
    process.cwd(),
    'src',
    'database',
    'triggers',
    'update_product_visible.sql',
  );
  const sql = readFileSync(sqlPath, 'utf8');
  await dataSource.query(sql);
}
void bootstrap();
