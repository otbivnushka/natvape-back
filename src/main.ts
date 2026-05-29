import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { startBot } from './bot';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

  const port = configService.get<number>('PORT', 3000);
  const host = (configService.get('HOST') as string) || 'localhost';
  await app.listen(port, host);

  const dataSource = app.get(DataSource);

  const visibleSqlPath = join(
    process.cwd(),
    'src',
    'database',
    'triggers',
    'update_product_visible.sql',
  );
  const visibleSql = readFileSync(visibleSqlPath, 'utf8');
  await dataSource.query(visibleSql);

  const ratingSqlPath = join(
    process.cwd(),
    'src',
    'database',
    'triggers',
    'update_product_rating.sql',
  );
  const ratingSql = readFileSync(ratingSqlPath, 'utf8');
  await dataSource.query(ratingSql);

  startBot(app);
}
void bootstrap();
