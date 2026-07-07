import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductAttribute } from './entities/product-attribute.entity';
import { Image } from '../images/entities/image.entity';
import { Rate } from '../rates/entities/rate.entity';
import { QueryProductsDto } from './dto/query-products.dto';

@Injectable()
export class ProductsService {
  private baseUrl: string;
  private placeholder = 'https://placehold.co/600x600?text=Нет+изображения';

  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductAttribute)
    private productAttributesRepository: Repository<ProductAttribute>,
    @InjectRepository(Rate)
    private ratesRepository: Repository<Rate>,
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
      .leftJoinAndSelect('product.colors', 'colors')
      .leftJoinAndSelect('product.attributes', 'productAttr')
      .leftJoinAndSelect('productAttr.attribute', 'attrDef');

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

    const attrArr = Array.isArray(query.attr) ? query.attr : query.attr ? [query.attr] : [];
    if (attrArr.length > 0) {
      attrArr.forEach((pair, index) => {
        const colonIdx = pair.indexOf(':');
        if (colonIdx === -1) return;
        const key = pair.slice(0, colonIdx);
        const value = pair.slice(colonIdx + 1);
        if (index === 0) {
          qb.andWhere('attrDef.key = :attrKey_0 AND productAttr.value = :attrVal_0', {
            attrKey_0: key,
            attrVal_0: value,
          });
        } else {
          const aa = `attrFilter_${index}`;
          const ad = `attrFilterDef_${index}`;
          qb.innerJoin('product.attributes', aa)
            .innerJoin(`${aa}.attribute`, ad)
            .andWhere(`${ad}.key = :attrKey_${index} AND ${aa}.value = :attrVal_${index}`, {
              [`attrKey_${index}`]: key,
              [`attrVal_${index}`]: value,
            });
        }
      });
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
    const limit = query.limit || 999;
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
        attributes:
          item.attributes?.map((a) => ({
            id: a.id,
            name: a.attribute.name,
            key: a.attribute.key,
            type: a.attribute.type,
            value: a.value,
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

  async findById(id: number, userId?: number) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: {
        category: true,
        image: true,
        variants: true,
        colors: true,
        attributes: { attribute: true },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let userRate: number | null = null;
    if (userId) {
      const rate = await this.ratesRepository.findOneBy({
        productId: id,
        userId,
      });
      userRate = rate?.value ?? null;
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
      userRate,
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
      attributes:
        product.attributes?.map((a) => ({
          id: a.id,
          name: a.attribute.name,
          key: a.attribute.key,
          type: a.attribute.type,
          value: a.value,
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

  async getAttributeValues(categoryKey: string) {
    const qb = this.productAttributesRepository
      .createQueryBuilder('pa')
      .innerJoin('pa.product', 'product')
      .innerJoin('product.category', 'category')
      .innerJoin('pa.attribute', 'attr')
      .where('category.key = :key', { key: categoryKey })
      .select('attr.key', 'key')
      .addSelect('attr.name', 'name')
      .addSelect('array_agg(DISTINCT pa.value) as values')
      .groupBy('attr.id')
      .addGroupBy('attr.key')
      .addGroupBy('attr.name')
      .orderBy('attr.id', 'ASC');

    return qb.getRawMany();
  }
}
