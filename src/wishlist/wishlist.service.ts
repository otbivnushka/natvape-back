import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistItem } from './entities/wishlist-item.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(WishlistItem)
    private wishlistRepository: Repository<WishlistItem>,
  ) {}

  private async getProductIds(userId: number): Promise<number[]> {
    const items = await this.wishlistRepository.find({
      where: { userId },
      select: { productId: true },
    });
    return items.map((item) => item.productId);
  }

  async getWishlist(userId: number) {
    const productIds = await this.getProductIds(userId);
    return { productIds };
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

    const productIds = await this.getProductIds(userId);
    return { productIds };
  }

  async removeItem(userId: number, productId: number) {
    const item = await this.wishlistRepository.findOne({
      where: { userId, productId },
    });

    if (!item) {
      throw new NotFoundException('Product not in wishlist');
    }

    await this.wishlistRepository.remove(item);

    const productIds = await this.getProductIds(userId);
    return { productIds };
  }
}
