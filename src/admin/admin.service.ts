import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { BonusService } from '../bonus/bonus.service';
import { BonusTransactionType } from '../bonus/entities/bonus-transaction.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ProductColor } from '../products/entities/product-color.entity';
import { Category } from '../categories/entities/category.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Image } from '../images/entities/image.entity';
import { StorySet } from '../stories/entities/story-set.entity';
import { Story } from '../stories/entities/story.entity';
import { Address } from '../addresses/entities/address.entity';
import { ProductAttribute } from '../products/entities/product-attribute.entity';
import { CategoryAttribute } from '../categories/entities/category-attribute.entity';
import { CreatePickupAddressDto } from './dto/create-pickup-address.dto';
import { CreateCategoryAttributeDto } from './dto/create-category-attribute.dto';
import { CreateProductAttributeDto } from './dto/create-product-attribute.dto';
import { UpdateProductAttributeDto } from './dto/update-product-attribute.dto';
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
import { AdjustBonusDto } from './dto/adjust-bonus.dto';

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
    @InjectRepository(Address)
    private addressesRepository: Repository<Address>,
    @InjectRepository(ProductAttribute)
    private productAttributesRepository: Repository<ProductAttribute>,
    @InjectRepository(CategoryAttribute)
    private categoryAttributesRepository: Repository<CategoryAttribute>,
    private dataSource: DataSource,
    private bonusService: BonusService,
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
      relations: { address: true, user: true, items: true },
    });
  }

  async getOrdersByDate(from?: string, to?: string) {
    const where: FindOptionsWhere<Order> = {};
    if (from && to) {
      where.createdAt = Between(new Date(from), new Date(to));
    } else if (from) {
      where.createdAt = MoreThanOrEqual(new Date(from));
    } else if (to) {
      where.createdAt = LessThanOrEqual(new Date(to));
    }
    return this.ordersRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: { address: true, user: true, items: true },
    });
  }

  async updateOrderStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.ordersRepository.findOneBy({ id });
    if (!order) throw new NotFoundException('Order not found');

    order.status = dto.status;
    return this.ordersRepository.save(order);
  }

  async updateOrderActualPrice(id: number, price: number) {
    const order = await this.ordersRepository.findOneBy({ id });
    if (!order) throw new NotFoundException('Order not found');

    order.actualPrice = price;
    return this.ordersRepository.save(order);
  }

  async deleteOrder(id: number) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { items: true, user: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (order.user) {
      await this.bonusService.expireByOrder(order.user, order);
    }

    for (const item of order.items) {
      if (!item.variantKey) continue;

      const variantResult = await this.dataSource
        .createQueryBuilder()
        .update('product_variants')
        .set({ stock: () => `stock + ${item.quantity}` })
        .where('product_id = :pid AND value = :val', {
          pid: item.productId,
          val: item.variantKey,
        })
        .execute();

      if (variantResult.affected === 0) {
        await this.dataSource
          .createQueryBuilder()
          .update('product_colors')
          .set({ stock: () => `stock + ${item.quantity}` })
          .where('product_id = :pid AND hex = :val', {
            pid: item.productId,
            val: item.variantKey,
          })
          .execute();
      }
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

  async createPickupAddress(dto: CreatePickupAddressDto) {
    const address = this.addressesRepository.create({ ...dto, isPickup: true });
    return this.addressesRepository.save(address);
  }

  async deletePickupAddress(id: number) {
    const address = await this.addressesRepository.findOneBy({ id });
    if (!address) throw new NotFoundException('Pickup address not found');
    await this.addressesRepository.remove(address);
  }

  async createCategoryAttribute(dto: CreateCategoryAttributeDto) {
    const attr = this.categoryAttributesRepository.create(dto);
    return this.categoryAttributesRepository.save(attr);
  }

  async deleteCategoryAttribute(id: number) {
    const attr = await this.categoryAttributesRepository.findOneBy({ id });
    if (!attr) throw new NotFoundException('Category attribute not found');
    await this.categoryAttributesRepository.remove(attr);
  }

  async createProductAttribute(
    productId: number,
    dto: CreateProductAttributeDto,
  ) {
    const product = await this.productsRepository.findOneBy({ id: productId });
    if (!product) throw new NotFoundException('Product not found');

    const attr = this.productAttributesRepository.create({
      productId,
      attributeId: dto.attributeId,
      value: dto.value,
    });
    return this.productAttributesRepository.save(attr);
  }

  async updateProductAttribute(attrId: number, dto: UpdateProductAttributeDto) {
    const attr = await this.productAttributesRepository.findOneBy({
      id: attrId,
    });
    if (!attr) throw new NotFoundException('Product attribute not found');

    attr.value = dto.value;
    return this.productAttributesRepository.save(attr);
  }

  async deleteProductAttribute(attrId: number) {
    const attr = await this.productAttributesRepository.findOneBy({
      id: attrId,
    });
    if (!attr) throw new NotFoundException('Product attribute not found');
    await this.productAttributesRepository.remove(attr);
  }

  async adjustUserBonus(userId: number, dto: AdjustBonusDto) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    await this.bonusService.adjust(
      user,
      dto.amount,
      dto.description ?? 'Ручная корректировка баланса',
    );

    const balance = await this.bonusService.getBalance(userId);
    return { userId, balance: Number(balance.toFixed(2)) };
  }

  async getProductsPage(page = 1, limit = 8) {
    const [items, total] = await this.productsRepository.findAndCount({
      relations: { variants: true, colors: true, image: true },
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: items.map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        variants: p.variants?.map((v) => ({ name: v.name, value: v.value })) ?? [],
        colors: p.colors?.map((c) => ({ name: c.name, hex: c.hex })) ?? [],
      })),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getOrderForEdit(orderId: number) {
    return this.ordersRepository.findOne({
      where: { id: orderId },
      relations: { items: true, user: true, address: true },
    });
  }

  async getProductForEdit(productId: number) {
    return this.productsRepository.findOne({
      where: { id: productId },
      relations: {
        variants: true,
        colors: true,
        image: true,
        attributes: { attribute: true },
      },
    });
  }

  private buildProductName(product: Product): string {
    return (
      product.name +
      (product.attributes?.length
        ? ' (' + product.attributes.map((a) => a.value).join(', ') + ')'
        : '')
    );
  }

  async addOrderItem(
    orderId: number,
    productId: number,
    variantKey: string | null,
    variantName: string | null,
    quantity: number,
  ) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Invalid quantity');
    }

    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: { items: true, user: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'sent') {
      throw new BadRequestException('Only sent orders can be edited');
    }

    const product = await this.productsRepository.findOne({
      where: { id: productId },
      relations: {
        variants: true,
        colors: true,
        image: true,
        attributes: { attribute: true },
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    let variant: ProductVariant | undefined;
    let color: ProductColor | undefined;
    if (variantKey) {
      variant = product.variants?.find((v) => v.value === variantKey);
      color = product.colors?.find((c) => c.hex === variantKey);
      if (!variant && !color) {
        throw new BadRequestException('Variant not found');
      }
      const stock = variant?.stock ?? color!.stock;
      if (stock < quantity) {
        throw new BadRequestException(`Insufficient stock: ${stock}`);
      }
    }

    const item = this.orderItemRepository.create({
      orderId,
      productId,
      productName: this.buildProductName(product),
      productImage:
        product.image?.filename ??
        'https://placehold.co/600x600?text=Нет+изображения',
      variantKey: variantKey ?? null,
      variantName: variantName ?? null,
      quantity,
      price: Number(product.price),
    });
    await this.orderItemRepository.save(item);

    if (variant) {
      await this.dataSource
        .createQueryBuilder()
        .update('product_variants')
        .set({ stock: () => `GREATEST(0, stock - ${quantity})` })
        .where('id = :id', { id: variant.id })
        .execute();
    } else if (color) {
      await this.dataSource
        .createQueryBuilder()
        .update('product_colors')
        .set({ stock: () => `GREATEST(0, stock - ${quantity})` })
        .where('id = :id', { id: color.id })
        .execute();
    }

    await this.recalculateOrder(orderId);
    return this.getOrderForEdit(orderId);
  }

  async removeOrderItem(orderId: number, itemId: number) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: { items: true, user: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'sent') {
      throw new BadRequestException('Only sent orders can be edited');
    }

    const item = order.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Order item not found');

    if (item.variantKey) {
      const variantResult = await this.dataSource
        .createQueryBuilder()
        .update('product_variants')
        .set({ stock: () => `stock + ${item.quantity}` })
        .where('product_id = :pid AND value = :val', {
          pid: item.productId,
          val: item.variantKey,
        })
        .execute();

      if (variantResult.affected === 0) {
        await this.dataSource
          .createQueryBuilder()
          .update('product_colors')
          .set({ stock: () => `stock + ${item.quantity}` })
          .where('product_id = :pid AND hex = :val', {
            pid: item.productId,
            val: item.variantKey,
          })
          .execute();
      }
    }

    await this.orderItemRepository.remove(item);
    await this.recalculateOrder(orderId);
    return this.getOrderForEdit(orderId);
  }

  async recalculateOrder(orderId: number) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: { items: true, user: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const items = order.items ?? [];

    const groups = new Map<number, OrderItem[]>();
    for (const item of items) {
      const arr = groups.get(item.productId) || [];
      arr.push(item);
      groups.set(item.productId, arr);
    }

    const productIds = Array.from(groups.keys());
    const products = productIds.length
      ? await this.productsRepository.find({ where: { id: In(productIds) } })
      : [];
    const doublePriceMap = new Map<number, number | null>();
    for (const p of products) {
      doublePriceMap.set(p.id, p.doublePrice ? Number(p.doublePrice) : null);
    }

    let subtotal = 0;
    let totalQty = 0;
    for (const [productId, group] of groups) {
      const qty = group.reduce((sum, i) => sum + i.quantity, 0);
      totalQty += qty;
      const price = Number(group[0].price);
      const doublePrice = doublePriceMap.get(productId) ?? null;
      if (!doublePrice) {
        subtotal += qty * price;
      } else {
        const pairs = Math.floor(qty / 2);
        const remainder = qty % 2;
        subtotal += pairs * doublePrice + remainder * price;
      }
    }

    const fee = order.deliveryMethod === 'delivery' && totalQty < 3 ? 3 : 0;
    const payable = Number((subtotal + fee).toFixed(2));

    const newBonusUsed = Math.min(order.bonusUsed ?? 0, Math.floor(payable));
    const refund = (order.bonusUsed ?? 0) - newBonusUsed;
    const newTotal = Number((payable - newBonusUsed).toFixed(2));
    const newBonusAccrued = Number((newTotal * 0.03).toFixed(2));
    const accrualDelta = Number(
      (newBonusAccrued - Number(order.bonusAccrued ?? 0)).toFixed(2),
    );

    if (order.user) {
      if (refund > 0) {
        await this.bonusService.adjustForOrder(
          order.user,
          order,
          refund,
          BonusTransactionType.ADMIN_ADJUSTMENT,
          `Возврат баллов за изменение заказа #${order.id}`,
        );
      }
      if (accrualDelta !== 0) {
        await this.bonusService.adjustForOrder(
          order.user,
          order,
          accrualDelta,
          accrualDelta > 0
            ? BonusTransactionType.ACCRUAL
            : BonusTransactionType.EXPIRE,
          `Пересчёт баллов за заказ #${order.id}`,
        );
      }
    }

    order.total = newTotal;
    order.actualPrice = newTotal;
    order.bonusUsed = newBonusUsed;
    order.bonusAccrued = newBonusAccrued;
    await this.ordersRepository.save(order);

    return this.getOrderForEdit(orderId);
  }
}
