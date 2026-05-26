import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Image } from '../images/entities/image.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private baseUrl: string;
  private placeholder = 'https://placehold.co/600x600?text=Нет+изображения';

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(CartItem)
    private cartRepository: Repository<CartItem>,
    private dataSource: DataSource,
    private configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
  }

  private resolveImageUrl(image: Image | null): string {
    if (!image) return this.placeholder;
    return `${this.baseUrl}/api/images/${image.filename}`;
  }

  private calcItemTotal(
    qty: number,
    price: number,
    doublePrice: number | null,
  ): number {
    if (!doublePrice) return qty * price;
    const pairs = Math.floor(qty / 2);
    const remainder = qty % 2;
    return pairs * doublePrice + remainder * price;
  }

  async create(userId: number, dto: CreateOrderDto) {
    const cartItems = await this.cartRepository.find({
      where: { userId },
      relations: {
        product: {
          variants: true,
          colors: true,
          category: true,
          image: true,
        },
      },
    });

    if (!cartItems.length) {
      throw new BadRequestException('Cart is empty');
    }

    const total = cartItems.reduce(
      (sum, item) =>
        sum +
        this.calcItemTotal(
          item.quantity,
          Number(item.product.price),
          item.product.doublePrice ? Number(item.product.doublePrice) : null,
        ),
      0,
    );

    const order = this.ordersRepository.create({
      userId,
      total: Number(total.toFixed(2)),
      status: 'sent',
      deliveryMethod: dto.deliveryMethod,
      comment: dto.comment ?? null,
      addressId: dto.addressId ?? null,
      deliveryTime: dto.deliveryTime ?? null,
    });

    const savedOrder = await this.ordersRepository.save(order);

    const orderItems = cartItems.map((item) =>
      this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: item.productId,
        productName: item.product.name,
        productImage: this.resolveImageUrl(item.product.image),
        variantKey: item.variantKey,
        variantName: item.variantKey
          ? (item.product.variants?.find((v) => v.value === item.variantKey)
              ?.name ?? null)
          : null,
        quantity: item.quantity,
        price: Number(item.product.price),
      }),
    );

    await this.orderItemRepository.save(orderItems);

    for (const item of cartItems) {
      if (item.variantKey) {
        const variant = item.product.variants?.find(
          (v) => v.value === item.variantKey,
        );
        const color = item.product.colors?.find(
          (c) => c.name === item.variantKey,
        );
        if (variant) {
          await this.dataSource
            .createQueryBuilder()
            .update('product_variants')
            .set({ stock: () => `GREATEST(0, stock - ${item.quantity})` })
            .where('id = :id', { id: variant.id })
            .execute();
        }
        if (color) {
          await this.dataSource
            .createQueryBuilder()
            .update('product_colors')
            .set({ stock: () => `GREATEST(0, stock - ${item.quantity})` })
            .where('id = :id', { id: color.id })
            .execute();
        }
      }
    }

    await this.cartRepository.delete({ userId });

    return this.ordersRepository.findOne({
      where: { id: savedOrder.id },
      relations: { items: true, address: true },
    });
  }

  async findAll(userId: number) {
    const orders = await this.ordersRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return orders.map((order) => ({
      id: order.id,
      total: Number(order.total),
      status: order.status,
      itemsCount: 0,
      addressId: order.addressId,
      deliveryTime: order.deliveryTime,
      createdAt: order.createdAt,
    }));
  }

  async findById(userId: number, orderId: number) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
      relations: { items: true, address: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
