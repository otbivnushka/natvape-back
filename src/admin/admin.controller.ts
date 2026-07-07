import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminService } from './admin.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateStorySetDto } from '../stories/dto/create-story-set.dto';
import { CreateStoryDto } from '../stories/dto/create-story.dto';
import { CreatePickupAddressDto } from './dto/create-pickup-address.dto';
import { CreateCategoryAttributeDto } from './dto/create-category-attribute.dto';
import { CreateProductAttributeDto } from './dto/create-product-attribute.dto';
import { UpdateProductAttributeDto } from './dto/update-product-attribute.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('products')
  @ApiOperation({ summary: 'Create product with variants and colors' })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update product fields' })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.adminService.updateProduct(+id, dto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete product' })
  async deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(+id);
  }

  @Post('products/:id/variants')
  @ApiOperation({ summary: 'Add variant to product' })
  async createVariant(
    @Param('id') productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.adminService.createVariant(+productId, dto);
  }

  @Patch('products/variants/:variantId')
  @ApiOperation({ summary: 'Update variant (name, value, stock)' })
  async updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.adminService.updateVariant(+variantId, dto);
  }

  @Delete('products/variants/:variantId')
  @ApiOperation({ summary: 'Delete variant' })
  async deleteVariant(@Param('variantId') variantId: string) {
    return this.adminService.deleteVariant(+variantId);
  }

  @Post('products/:id/colors')
  @ApiOperation({ summary: 'Add color to product' })
  async createColor(
    @Param('id') productId: string,
    @Body() dto: CreateColorDto,
  ) {
    return this.adminService.createColor(+productId, dto);
  }

  @Patch('products/colors/:colorId')
  @ApiOperation({ summary: 'Update color (name, hex, stock)' })
  async updateColor(
    @Param('colorId') colorId: string,
    @Body() dto: UpdateColorDto,
  ) {
    return this.adminService.updateColor(+colorId, dto);
  }

  @Delete('products/colors/:colorId')
  @ApiOperation({ summary: 'Delete color' })
  async deleteColor(@Param('colorId') colorId: string) {
    return this.adminService.deleteColor(+colorId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create category' })
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update category' })
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminService.updateCategory(+id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete category' })
  async deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(+id);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders (admin)' })
  async getAllOrders() {
    return this.adminService.getAllOrders();
  }

  @Get('orders/user/:userId')
  @ApiOperation({ summary: 'Get all orders from user (admin)' })
  async getAllOrdersByUserId(@Param('userId') userId: string) {
    return this.adminService.getAllOrdersByUserId(+userId);
  }

  @Get('orders/sent')
  @ApiOperation({ summary: 'Get orders with status "sent"' })
  async getSentOrders() {
    return this.adminService.getSentOrders();
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status (sent → end)' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(+id, dto);
  }

  @Delete('orders/:id')
  @ApiOperation({ summary: 'Delete order' })
  async deleteOrder(@Param('id') id: string) {
    return this.adminService.deleteOrder(+id);
  }

  @Post('story-sets')
  @ApiOperation({ summary: 'Create story set with stories' })
  async createStorySet(@Body() dto: CreateStorySetDto) {
    return this.adminService.createStorySet(dto);
  }

  @Delete('story-sets/:id')
  @ApiOperation({ summary: 'Delete story set' })
  async deleteStorySet(@Param('id') id: string) {
    return this.adminService.deleteStorySet(+id);
  }

  @Post('story-sets/:id/stories')
  @ApiOperation({ summary: 'Add story to story set' })
  async createStory(
    @Param('id') storySetId: string,
    @Body() dto: CreateStoryDto,
  ) {
    return this.adminService.createStory(+storySetId, dto);
  }

  @Delete('stories/:id')
  @ApiOperation({ summary: 'Delete story' })
  async deleteStory(@Param('id') id: string) {
    return this.adminService.deleteStory(+id);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Create pickup address' })
  async createPickupAddress(@Body() dto: CreatePickupAddressDto) {
    return this.adminService.createPickupAddress(dto);
  }

  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Delete pickup address' })
  async deletePickupAddress(@Param('id') id: string) {
    return this.adminService.deletePickupAddress(+id);
  }

  @Post('category-attributes')
  @ApiOperation({ summary: 'Create category attribute' })
  async createCategoryAttribute(@Body() dto: CreateCategoryAttributeDto) {
    return this.adminService.createCategoryAttribute(dto);
  }

  @Delete('category-attributes/:id')
  @ApiOperation({ summary: 'Delete category attribute' })
  async deleteCategoryAttribute(@Param('id') id: string) {
    return this.adminService.deleteCategoryAttribute(+id);
  }

  @Post('products/:id/attributes')
  @ApiOperation({ summary: 'Add attribute value to product' })
  async createProductAttribute(
    @Param('id') productId: string,
    @Body() dto: CreateProductAttributeDto,
  ) {
    return this.adminService.createProductAttribute(+productId, dto);
  }

  @Patch('products/attributes/:attrId')
  @ApiOperation({ summary: 'Update product attribute value' })
  async updateProductAttribute(
    @Param('attrId') attrId: string,
    @Body() dto: UpdateProductAttributeDto,
  ) {
    return this.adminService.updateProductAttribute(+attrId, dto);
  }

  @Delete('products/attributes/:attrId')
  @ApiOperation({ summary: 'Delete product attribute value' })
  async deleteProductAttribute(@Param('attrId') attrId: string) {
    return this.adminService.deleteProductAttribute(+attrId);
  }
}
