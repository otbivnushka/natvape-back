import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(CartItem)
    private cartRepository: Repository<CartItem>,
    private dataSource: DataSource,
  ) {}

  async create(userId: number, dto: CreateOrderDto) {
    const cartItems = await this.cartRepository.find({
      where: { userId },
      relations: {
        product: {
          variants: true,
          colors: true,
          category: true,
        },
      },
    });

    if (!cartItems.length) {
      throw new BadRequestException('Cart is empty');
    }

    const total = cartItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.price),
      0,
    );

    const order = this.ordersRepository.create({
      userId,
      total: Number(total.toFixed(2)),
      status: 'processing',
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
        productImage: item.product.image,
        variantKey: item.variantKey,
        variantName: item.variantKey
          ? item.product.variants?.find((v) => v.value === item.variantKey)?.name ?? null
          : null,
        quantity: item.quantity,
        price: Number(item.product.price),
      }),
    );

    await this.orderItemRepository.save(orderItems);

    for (const item of cartItems) {
      if (item.variantKey) {
        const variant = item.product.variants?.find((v) => v.value === item.variantKey);
        if (variant) {
          await this.dataSource
            .createQueryBuilder()
            .update('product_variants')
            .set({ stock: () => `GREATEST(0, stock - ${item.quantity})` })
            .where('id = :id', { id: variant.id })
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
