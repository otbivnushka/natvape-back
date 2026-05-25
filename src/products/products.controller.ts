import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';

@Controller('api/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  async findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get('brands')
  async getBrands(@Query('category') category?: string) {
    return this.productsService.getBrands(category);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.productsService.findById(+id);
  }
}
