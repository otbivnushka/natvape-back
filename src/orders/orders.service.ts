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
    return `${this.baseUrl}/api/images/${image.filename}`;
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
    console.log(`[Order] Creating order for userId=${userId}, method=${dto.deliveryMethod}`);

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
      console.log(`[Order] Cart empty for userId=${userId}`);
      throw new BadRequestException('Cart is empty');
    }

    console.log(`[Order] Cart items count=${cartItems.length}`);
    for (const item of cartItems) {
      console.log(
        `  - productId=${item.productId} name="${item.product.name}" qty=${item.quantity} variantKey="${item.variantKey}" price=${item.product.price}`,
      );
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
    console.log(`[Order] Groups=${groups.size} total=${Number(total.toFixed(2))}`);

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
    console.log(`[Order] Saved order #${savedOrder.id}`);

    const orderItems = cartItems.map((item) =>
      this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: item.productId,
        productName: item.product.name,
        productImage: this.resolveImageUrl(item.product.image),
        variantKey: item.variantKey,
        variantName: item.variantKey
          ? (item.product.variants?.find((v) => v.value === item.variantKey)
              ?.name ??
            item.product.colors?.find((v) => v.name === item.variantKey)
              ?.name ??
            null)
          : null,
        quantity: item.quantity,
        price: Number(item.product.price),
      }),
    );

    await this.orderItemRepository.save(orderItems);
    console.log(`[Order] Saved ${orderItems.length} order items`);

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
          console.log(`  - deducted stock variant id=${variant.id} qty=${item.quantity}`);
        }
        if (color) {
          await this.dataSource
            .createQueryBuilder()
            .update('product_colors')
            .set({ stock: () => `GREATEST(0, stock - ${item.quantity})` })
            .where('id = :id', { id: color.id })
            .execute();
          console.log(`  - deducted stock color id=${color.id} qty=${item.quantity}`);
        }
      }
    }

    await this.cartRepository.delete({ userId });
    console.log(`[Order] Cart cleared for userId=${userId}`);

    const returnOrder = await this.ordersRepository.findOne({
      where: { id: savedOrder.id },
      relations: { items: true, address: true, user: true },
    });

    const admins = await this.usersService.findAllAdmins();
    console.log(`[Order] Sending Telegram notification to ${admins.length} admins`);
    for (const admin of admins) {
      const ok = await sendTelegramMessage(
        admin.telegramId,
        buildOrderMessage(returnOrder!),
      );
      console.log(`  - admin telegramId=${admin.telegramId} sent=${ok}`);
    }

    console.log(`[Order] Done #${savedOrder.id}`);
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
    if (user.isAdmin) {
      return order;
    }

    if (order?.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }
}
