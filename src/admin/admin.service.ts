import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ProductColor } from '../products/entities/product-color.entity';
import { Category } from '../categories/entities/category.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Image } from '../images/entities/image.entity';
import { StorySet } from '../stories/entities/story-set.entity';
import { Story } from '../stories/entities/story.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { User } from '../users/entities/user.entity';
import { CreateStorySetDto } from '../stories/dto/create-story-set.dto';
import { CreateStoryDto } from '../stories/dto/create-story.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantsRepository: Repository<ProductVariant>,
    @InjectRepository(ProductColor)
    private colorsRepository: Repository<ProductColor>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Image)
    private imagesRepository: Repository<Image>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(StorySet)
    private storySetsRepository: Repository<StorySet>,
    @InjectRepository(Story)
    private storiesRepository: Repository<Story>,
    private dataSource: DataSource,
  ) {}

  async createProduct(dto: CreateProductDto) {
    const { variants, colors, imageId, ...productData } = dto;

    const product = this.productsRepository.create({
      ...productData,
      rating: dto.rating ?? 0,
      image: imageId
        ? await this.imagesRepository.findOneBy({ id: imageId })
        : null,
    });

    const saved = await this.productsRepository.save(product);

    if (variants?.length) {
      const variantEntities = variants.map((v) =>
        this.variantsRepository.create({ ...v, productId: saved.id }),
      );
      await this.variantsRepository.save(variantEntities);
    }

    if (colors?.length) {
      const colorEntities = colors.map((c) =>
        this.colorsRepository.create({ ...c, productId: saved.id }),
      );
      await this.colorsRepository.save(colorEntities);
    }

    return this.productsRepository.findOne({
      where: { id: saved.id },
      relations: { category: true, variants: true, colors: true },
    });
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    const product = await this.productsRepository.findOneBy({ id });
    if (!product) throw new NotFoundException('Product not found');

    if (dto.imageId !== undefined) {
      product.image = dto.imageId
        ? await this.imagesRepository.findOneBy({ id: dto.imageId })
        : null;
    }

    const { imageId: _imageId, ...rest } = dto;
    Object.assign(product, rest);
    return this.productsRepository.save(product);
  }

  async deleteProduct(id: number) {
    const product = await this.productsRepository.findOneBy({ id });
    if (!product) throw new NotFoundException('Product not found');

    await this.productsRepository.remove(product);
  }

  async createVariant(productId: number, dto: CreateVariantDto) {
    const product = await this.productsRepository.findOneBy({ id: productId });
    if (!product) throw new NotFoundException('Product not found');

    const variant = this.variantsRepository.create({ ...dto, productId });
    return this.variantsRepository.save(variant);
  }

  async updateVariant(variantId: number, dto: UpdateVariantDto) {
    const variant = await this.variantsRepository.findOneBy({ id: variantId });
    if (!variant) throw new NotFoundException('Variant not found');

    Object.assign(variant, dto);
    return this.variantsRepository.save(variant);
  }

  async deleteVariant(variantId: number) {
    const variant = await this.variantsRepository.findOneBy({ id: variantId });
    if (!variant) throw new NotFoundException('Variant not found');

    await this.variantsRepository.remove(variant);
  }

  async createColor(productId: number, dto: CreateColorDto) {
    const product = await this.productsRepository.findOneBy({ id: productId });
    if (!product) throw new NotFoundException('Product not found');

    const color = this.colorsRepository.create({ ...dto, productId });
    return this.colorsRepository.save(color);
  }

  async updateColor(colorId: number, dto: UpdateColorDto) {
    const color = await this.colorsRepository.findOneBy({ id: colorId });
    if (!color) throw new NotFoundException('Color not found');

    Object.assign(color, dto);
    return this.colorsRepository.save(color);
  }

  async deleteColor(colorId: number) {
    const color = await this.colorsRepository.findOneBy({ id: colorId });
    if (!color) throw new NotFoundException('Color not found');

    await this.colorsRepository.remove(color);
  }

  async createCategory(dto: CreateCategoryDto) {
    const category = this.categoriesRepository.create(dto);
    return this.categoriesRepository.save(category);
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    const category = await this.categoriesRepository.findOneBy({ id });
    if (!category) throw new NotFoundException('Category not found');

    Object.assign(category, dto);
    return this.categoriesRepository.save(category);
  }

  async deleteCategory(id: number) {
    const category = await this.categoriesRepository.findOneBy({ id });
    if (!category) throw new NotFoundException('Category not found');

    await this.categoriesRepository.remove(category);
  }

  async getAllOrders() {
    return this.ordersRepository.find({
      order: { createdAt: 'DESC' },
      relations: { items: true, address: true, user: true },
    });
  }

  async getAllOrdersByUserId(userId: number) {
    return this.ordersRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: { items: true, address: true, user: true },
    });
  }

  async getSentOrders() {
    return this.ordersRepository.find({
      where: { status: 'sent' },
      order: { createdAt: 'DESC' },
      relations: { user: true, items: true },
    });
  }

  async updateOrderStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.ordersRepository.findOneBy({ id });
    if (!order) throw new NotFoundException('Order not found');

    order.status = dto.status;
    return this.ordersRepository.save(order);
  }

  async deleteOrder(id: number) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    for (const item of order.items) {
      if (!item.variantKey) continue;

      await this.dataSource
        .createQueryBuilder()
        .update('product_variants')
        .set({ stock: () => `stock + ${item.quantity}` })
        .where('product_id = :pid AND value = :val', {
          pid: item.productId,
          val: item.variantKey,
        })
        .execute();

      await this.dataSource
        .createQueryBuilder()
        .update('product_colors')
        .set({ stock: () => `stock + ${item.quantity}` })
        .where('product_id = :pid AND name = :val', {
          pid: item.productId,
          val: item.variantKey,
        })
        .execute();
    }

    await this.ordersRepository.remove(order);
  }

  async makeAdmin(telegramUsername: string) {
    const user = await this.usersRepository.findOneBy({ telegramUsername });
    if (!user) return new NotFoundException('User not found');

    user.isAdmin = true;
    return this.usersRepository.save(user);
  }

  async removeAdmin(telegramUsername: string) {
    const user = await this.usersRepository.findOneBy({ telegramUsername });
    if (!user) return new NotFoundException('User not found');

    user.isAdmin = false;
    return this.usersRepository.save(user);
  }

  async swapOrder(telegramUsername: string, orderId: number) {
    const user = await this.usersRepository.findOneBy({ telegramUsername });
    if (!user) return new NotFoundException('User not found');

    const order = await this.ordersRepository.findOneBy({ id: orderId });
    if (!order) return new NotFoundException('Order not found');

    order.userId = user.id;
    return this.ordersRepository.save(order);
  }

  async createStorySet(dto: CreateStorySetDto) {
    const { stories, imageId, ...data } = dto;
    const set = this.storySetsRepository.create({
      ...data,
      image: imageId
        ? await this.imagesRepository.findOneBy({ id: imageId })
        : null,
    });
    const saved = await this.storySetsRepository.save(set);

    if (stories?.length) {
      const storyEntities = await Promise.all(
        stories.map(async (s) =>
          this.storiesRepository.create({
            ...s,
            image: s.imageId
              ? await this.imagesRepository.findOneBy({ id: s.imageId })
              : null,
            storySetId: saved.id,
          }),
        ),
      );
      await this.storiesRepository.save(storyEntities);
    }

    return this.storySetsRepository.findOne({
      where: { id: saved.id },
      relations: { image: true, stories: { image: true } },
    });
  }

  async deleteStorySet(id: number) {
    const set = await this.storySetsRepository.findOneBy({ id });
    if (!set) throw new NotFoundException('StorySet not found');
    await this.storySetsRepository.remove(set);
  }

  async createStory(storySetId: number, dto: CreateStoryDto) {
    const set = await this.storySetsRepository.findOneBy({ id: storySetId });
    if (!set) throw new NotFoundException('StorySet not found');

    const story = this.storiesRepository.create({
      ...dto,
      image: dto.imageId
        ? await this.imagesRepository.findOneBy({ id: dto.imageId })
        : null,
      storySetId,
    });
    return this.storiesRepository.save(story);
  }

  async deleteStory(id: number) {
    const story = await this.storiesRepository.findOneBy({ id });
    if (!story) throw new NotFoundException('Story not found');
    await this.storiesRepository.remove(story);
  }
}
