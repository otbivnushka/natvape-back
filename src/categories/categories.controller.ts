import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('api/categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories with product count' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id/attributes')
  @ApiOperation({ summary: 'Get all attributes for a category' })
  async getAttributes(@Param('id') id: string) {
    return this.categoriesService.getAttributes(+id);
  }
}
