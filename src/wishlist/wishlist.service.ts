import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product } from '../products/entities/product.entity';
import { Image } from '../images/entities/image.entity';

@Injectable()
export class WishlistService {
  private baseUrl: string;
  private placeholder = 'https://placehold.co/600x600?text=Нет+изображения';

  constructor(
    @InjectRepository(WishlistItem)
    private wishlistRepository: Repository<WishlistItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Image)
    private imagesRepository: Repository<Image>,
    private configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
  }

  private resolveImageUrl(image: Image | null): string {
    if (!image) return this.placeholder;
    return `${this.baseUrl}/api/images/${image.filename}`;
  }

  async getWishlist(userId: number) {
    const items = await this.wishlistRepository.find({
      where: { userId },
      relations: {
        product: { image: true, category: true },
      },
    });

    return {
      items: items.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        category: item.product.category,
        price: Number(item.product.price),
        doublePrice: item.product.doublePrice
          ? Number(item.product.doublePrice)
          : null,
        rating: Number(item.product.rating),
        image: this.resolveImageUrl(item.product.image),
        imageId: item.product.image?.id ?? null,
        badge: item.product.badge,
        brand: item.product.brand,
        variantLabel: item.product.variantLabel,
        visible: item.product.visible,
      })),
    };
  }

  async addItem(userId: number, productId: number) {
    const existing = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (existing) {
      throw new ConflictException('Already in wishlist');
    }

    const item = this.wishlistRepository.create({ userId, productId });
    await this.wishlistRepository.save(item);

    return this.getWishlist(userId);
  }

  async removeItem(userId: number, productId: number) {
    const item = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (!item) {
      throw new NotFoundException('Product not in wishlist');
    }

    await this.wishlistRepository.remove(item);

    return this.getWishlist(userId);
  }
}
