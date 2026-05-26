import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { Image } from '../images/entities/image.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  private baseUrl: string;
  private placeholder = 'https://placehold.co/600x600?text=Нет+изображения';

  constructor(
    @InjectRepository(CartItem)
    private cartRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
  }

  private resolveImageUrl(image: Image | null): string {
    if (!image) return this.placeholder;
    return `${this.baseUrl}/api/images/${image.filename}`;
  }

  private async getFullCart(userId: number) {
    const items = await this.cartRepository.find({
      where: { userId },
      relations: { product: { category: true, image: true } },
    });

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.price),
      0,
    );

    return {
      items: items.map((item) => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: Number(item.product.price),
          image: this.resolveImageUrl(item.product.image),
          imageId: item.product.image?.id ?? null,
          category: item.product.category,
          brand: item.product.brand,
          badge: item.product.badge,
        },
        quantity: item.quantity,
        variantKey: item.variantKey,
      })),
      totalItems,
      subtotal,
    };
  }

  async getCart(userId: number) {
    return this.getFullCart(userId);
  }

  async addItem(userId: number, dto: AddToCartDto) {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.cartRepository.findOne({
      where: {
        userId,
        productId: dto.productId,
        variantKey: dto.variantKey ?? IsNull(),
      },
    });

    if (existing) {
      existing.quantity += dto.quantity;
      await this.cartRepository.save(existing);
    } else {
      const item = this.cartRepository.create({
        userId,
        productId: dto.productId,
        quantity: dto.quantity,
        variantKey: dto.variantKey ?? null,
      });
      await this.cartRepository.save(item);
    }

    return this.getFullCart(userId);
  }

  async updateItem(userId: number, itemId: number, dto: UpdateCartItemDto) {
    const item = await this.cartRepository.findOne({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    item.quantity = dto.quantity;
    await this.cartRepository.save(item);

    return this.getFullCart(userId);
  }

  async removeItem(userId: number, itemId: number) {
    const item = await this.cartRepository.findOne({
      where: { id: itemId, userId },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartRepository.remove(item);

    return this.getFullCart(userId);
  }

  async clearCart(userId: number) {
    await this.cartRepository.delete({ userId });
    return { items: [], totalItems: 0, subtotal: 0 };
  }
}
