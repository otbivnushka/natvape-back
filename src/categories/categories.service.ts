import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CategoryAttribute } from './entities/category-attribute.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @InjectRepository(CategoryAttribute)
    private categoryAttributesRepository: Repository<CategoryAttribute>,
  ) {}

  async findAll() {
    const categories = await this.categoriesRepository.find({
      relations: { products: true },
      order: { id: 'ASC' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      key: cat.key,
      label: cat.label,
      productCount: cat.products?.filter((p) => p.visible).length || 0,
    }));
  }

  async getAttributes(categoryId: number) {
    const category = await this.categoriesRepository.findOneBy({ id: categoryId });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return this.categoryAttributesRepository.find({
      where: { categoryId },
      select: { id: true, name: true, key: true, type: true, required: true },
    });
  }
}
