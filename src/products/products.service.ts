import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Image } from '../images/entities/image.entity';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  private baseUrl: string;
  private placeholder = 'https://placehold.co/600x600?text=Нет+изображения';

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
  }

  private resolveImageUrl(image: Image | null): string {
    if (!image) return this.placeholder;
    return `${this.baseUrl}/api/images/${image.filename}`;
  }

  async findAll(query: QueryProductsDto) {
    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.image', 'image')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.colors', 'colors');

    if (query.category) {
      qb.andWhere('category.key = :category', { category: query.category });
      qb.andWhere('product.visible = :visible', { visible: true });
    }

    if (query.search) {
      qb.andWhere('product.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.brand) {
      qb.andWhere('product.brand = :brand', { brand: query.brand });
    }

    if (query.priceMin !== undefined) {
      qb.andWhere('product.price >= :priceMin', { priceMin: query.priceMin });
    }

    if (query.priceMax !== undefined) {
      qb.andWhere('product.price <= :priceMax', { priceMax: query.priceMax });
    }

    switch (query.sort) {
      case 'price-asc':
        qb.orderBy('product.price', 'ASC');
        break;
      case 'price-desc':
        qb.orderBy('product.price', 'DESC');
        break;
      case 'rating':
        qb.orderBy('product.rating', 'DESC');
        break;
      case 'name':
        qb.orderBy('product.name', 'ASC');
        break;
      default:
        qb.orderBy('product.id', 'ASC');
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    qb.skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: Number(item.price),
        doublePrice: item.doublePrice ? Number(item.doublePrice) : null,
        rating: Number(item.rating),
        image: this.resolveImageUrl(item.image),
        imageId: item.image?.id ?? null,
        badge: item.badge,
        brand: item.brand,
        variantLabel: item.variantLabel,
        visible: item.visible,
        variants:
          item.variants?.map((v) => ({
            name: v.name,
            value: v.value,
            stock: v.stock,
          })) || [],
        colors:
          item.colors?.map((c) => ({
            name: c.name,
            hex: c.hex,
            stock: c.stock,
          })) || [],
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: { category: true, image: true, variants: true, colors: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      id: product.id,
      name: product.name,
      category: product.category,
      price: Number(product.price),
      doublePrice: product.doublePrice ? Number(product.doublePrice) : null,
      rating: Number(product.rating),
      image: this.resolveImageUrl(product.image),
      imageId: product.image?.id ?? null,
      description: product.description,
      badge: product.badge,
      brand: product.brand,
      variantLabel: product.variantLabel,
      visible: product.visible,
      variants:
        product.variants?.map((v) => ({
          id: v.id,
          name: v.name,
          value: v.value,
          stock: v.stock,
        })) || [],
      colors:
        product.colors?.map((c) => ({
          id: c.id,
          name: c.name,
          hex: c.hex,
          stock: c.stock,
        })) || [],
    };
  }

  async getBrands(category?: string) {
    const qb = this.productsRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.brand', 'brand')
      .leftJoin('product.category', 'category');

    if (category) {
      qb.andWhere('category.key = :category', { category });
    }

    const result = await qb.getRawMany();
    return result.map((r) => r.brand);
  }
}
