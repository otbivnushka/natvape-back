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

@Controller('api/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('products')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Put('products/:id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.adminService.updateProduct(+id, dto);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(+id);
  }

  @Post('products/:id/variants')
  async createVariant(
    @Param('id') productId: string,
    @Body() dto: CreateVariantDto,
  ) {
    return this.adminService.createVariant(+productId, dto);
  }

  @Patch('products/variants/:variantId')
  async updateVariant(
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.adminService.updateVariant(+variantId, dto);
  }

  @Delete('products/variants/:variantId')
  async deleteVariant(@Param('variantId') variantId: string) {
    return this.adminService.deleteVariant(+variantId);
  }

  @Post('products/:id/colors')
  async createColor(
    @Param('id') productId: string,
    @Body() dto: CreateColorDto,
  ) {
    return this.adminService.createColor(+productId, dto);
  }

  @Patch('products/colors/:colorId')
  async updateColor(
    @Param('colorId') colorId: string,
    @Body() dto: UpdateColorDto,
  ) {
    return this.adminService.updateColor(+colorId, dto);
  }

  @Delete('products/colors/:colorId')
  async deleteColor(@Param('colorId') colorId: string) {
    return this.adminService.deleteColor(+colorId);
  }

  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.adminService.updateCategory(+id, dto);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(+id);
  }

  @Get('orders')
  async getAllOrders() {
    return this.adminService.getAllOrders();
  }

  @Get('orders/sent')
  async getSentOrders() {
    return this.adminService.getSentOrders();
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(+id, dto);
  }

  @Delete('orders/:id')
  async deleteOrder(@Param('id') id: string) {
    return this.adminService.deleteOrder(+id);
  }
}
