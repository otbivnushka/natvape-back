import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';

@ApiTags('Products')
@Controller('api/products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with filters and pagination' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  async findAll(@Query() query: QueryProductsDto) {
    console.log('findAll query:', JSON.stringify(query));
    return this.productsService.findAll(query);
  }

  @Get('attribute-values')
  @ApiOperation({ summary: 'Get unique attribute values for a category' })
  @ApiQuery({ name: 'category', required: true })
  async getAttributeValues(@Query('category') category: string) {
    return this.productsService.getAttributeValues(category);
  }

  @Get('brands')
  @ApiOperation({
    summary: 'Get unique brands (optionally filtered by category)',
  })
  @ApiQuery({ name: 'category', required: false })
  async getBrands(@Query('category') category?: string) {
    return this.productsService.getBrands(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  async findById(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.productsService.findById(+id, userId ? +userId : undefined);
  }
}
