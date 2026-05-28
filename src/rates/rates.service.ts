import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Rate } from './entities/rate.entity';

@Injectable()
export class RatesService {
  constructor(
    @InjectRepository(Rate)
    private ratesRepository: Repository<Rate>,
  ) {}

  async upsert(userId: number, productId: number, value: number) {
    let rate = await this.ratesRepository.findOneBy({ userId, productId });
    if (value === 0) {
      if (rate) {
        await this.ratesRepository.remove(rate);
      }
      return null;
    }
    if (rate) {
      rate.value = value;
    } else {
      rate = this.ratesRepository.create({ userId, productId, value });
    }
    return this.ratesRepository.save(rate);
  }

  async findByProductAndUser(productId: number, userId: number) {
    return this.ratesRepository.findOneBy({ productId, userId });
  }

  async findByProductsAndUser(productIds: number[], userId: number) {
    if (!productIds.length) return new Map<number, number>();
    const rates = await this.ratesRepository.find({
      where: { productId: In(productIds), userId },
    });
    const map = new Map<number, number>();
    for (const r of rates) {
      map.set(r.productId, r.value);
    }
    return map;
  }
}
