import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
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
}
