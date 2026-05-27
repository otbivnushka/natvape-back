import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Address } from '../addresses/entities/address.entity';
import { Image } from '../images/entities/image.entity';
import { UsersModule } from '../users/users.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, CartItem, Address, Image]),
    UsersModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
