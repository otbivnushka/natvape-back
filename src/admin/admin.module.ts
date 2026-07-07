import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ProductColor } from '../products/entities/product-color.entity';
import { ProductAttribute } from '../products/entities/product-attribute.entity';
import { Category } from '../categories/entities/category.entity';
import { CategoryAttribute } from '../categories/entities/category-attribute.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Image } from '../images/entities/image.entity';
import { StorySet } from '../stories/entities/story-set.entity';
import { Story } from '../stories/entities/story.entity';
import { Address } from '../addresses/entities/address.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariant,
      ProductColor,
      ProductAttribute,
      Category,
      CategoryAttribute,
      Order,
      OrderItem,
      Image,
      User,
      StorySet,
      Story,
      Address,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
