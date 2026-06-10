import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Image } from '../images/entities/image.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UsersService } from '../users/users.service';
import { sendTelegramMessage } from '../utils/sendTelegramMessage';
import { buildOrderMessage } from '../utils/buildOrderMessage';

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
    private usersService: UsersService,
  ) {
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
  }

  private resolveImageUrl(image: Image | null): string {
    if (!image) return this.placeholder;
    return `${image.filename}`;
  }

  private resolveProductImage(url: string): string {
    if (url.startsWith('http')) return url;
    return `${this.baseUrl}/api/images/${url}`;
  }

  private calcGroupTotal(items: CartItem[]): number {
    const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
    const price = Number(items[0].product.price);
    const doublePrice = items[0].product.doublePrice
      ? Number(items[0].product.doublePrice)
      : null;

    if (!doublePrice) return totalQty * price;
    const pairs = Math.floor(totalQty / 2);
    const remainder = totalQty % 2;
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

    const groups = new Map<number, CartItem[]>();
    for (const item of cartItems) {
      const arr = groups.get(item.productId) || [];
      arr.push(item);
      groups.set(item.productId, arr);
    }

    const total = Array.from(groups.values()).reduce(
      (sum, group) => sum + this.calcGroupTotal(group),
      0,
    );
    const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    let deliveryFee = 0;
    if (dto.deliveryMethod === 'delivery' && totalQty < 3) {
      deliveryFee = 3;
    }
    const finalTotal = Number(total.toFixed(2)) + deliveryFee;

    const order = this.ordersRepository.create({
      userId,
      total: finalTotal,
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
        variantName: item.variantName ?? null,
        quantity: item.quantity,
        price: Number(item.product.price),
      }),
    );

    await this.orderItemRepository.save(orderItems);

    for (const item of cartItems) {
      console.log(JSON.stringify(item));
      if (item.variantKey) {
        const variant = item.product.variants?.find(
          (v) => v.value === item.variantKey,
        );
        if (variant) {
          await this.dataSource
            .createQueryBuilder()
            .update('product_variants')
            .set({ stock: () => `GREATEST(0, stock - ${item.quantity})` })
            .where('id = :id', { id: variant.id })
            .execute();
        } else {
          const color = item.product.colors?.find(
            (c) => c.hex === item.variantKey,
          );
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
    }

    await this.cartRepository.delete({ userId });

    const returnOrder = await this.ordersRepository.findOne({
      where: { id: savedOrder.id },
      relations: { items: true, address: true, user: true },
    });

    const admins = await this.usersService.findAllAdmins();
    for (const admin of admins) {
      await sendTelegramMessage(
        admin.telegramId,
        buildOrderMessage(returnOrder!),
      );
    }

    return returnOrder;
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
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: { items: true, address: true, user: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }
    const items = order.items.map((item) => ({
      ...item,
      productImage: this.resolveProductImage(item.productImage),
    }));

    if (user.isAdmin) {
      return { ...order, items };
    }

    if (order?.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return { ...order, items };
  }
}
