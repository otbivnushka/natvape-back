import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BonusTransaction,
  BonusTransactionType,
} from './entities/bonus-transaction.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class BonusService {
  constructor(
    @InjectRepository(BonusTransaction)
    private bonusTransactionsRepository: Repository<BonusTransaction>,
  ) {}

  async getBalance(userId: number): Promise<number> {
    const result = await this.bonusTransactionsRepository
      .createQueryBuilder('bt')
      .select('COALESCE(SUM(bt.amount), 0)', 'balance')
      .where('bt.user_id = :userId', { userId })
      .getRawOne();

    return Number(result.balance);
  }

  async getHistory(userId: number): Promise<BonusTransaction[]> {
    return this.bonusTransactionsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async accrue(
    user: User,
    order: Order,
    amount: number,
    description?: string,
  ): Promise<void> {
    await this.bonusTransactionsRepository.save(
      this.bonusTransactionsRepository.create({
        userId: user.id,
        orderId: order.id,
        amount: Number(amount.toFixed(2)),
        type: BonusTransactionType.ACCRUAL,
        description: description ?? `Начисление за заказ #${order.id}`,
      }),
    );
  }

  async spend(
    user: User,
    order: Order,
    amount: number,
    description?: string,
  ): Promise<void> {
    await this.bonusTransactionsRepository.save(
      this.bonusTransactionsRepository.create({
        userId: user.id,
        orderId: order.id,
        amount: -Math.abs(amount),
        type: BonusTransactionType.SPEND,
        description: description ?? `Оплата заказа #${order.id} баллами`,
      }),
    );
  }

  async expireByOrder(user: User, order: Order): Promise<void> {
    if (order.bonusAccrued && Number(order.bonusAccrued) > 0) {
      await this.bonusTransactionsRepository.save(
        this.bonusTransactionsRepository.create({
          userId: user.id,
          orderId: order.id,
          amount: -Math.abs(Number(order.bonusAccrued)),
          type: BonusTransactionType.EXPIRE,
          description: description_for_expire(order.id),
        }),
      );
    }

    if (order.bonusUsed && Number(order.bonusUsed) > 0) {
      await this.bonusTransactionsRepository.save(
        this.bonusTransactionsRepository.create({
          userId: user.id,
          orderId: order.id,
          amount: Math.abs(Number(order.bonusUsed)),
          type: BonusTransactionType.ADMIN_ADJUSTMENT,
          description: `Возврат баллов за отменённый заказ #${order.id}`,
        }),
      );
    }
  }

  async adjust(
    user: User,
    amount: number,
    description: string,
  ): Promise<void> {
    await this.bonusTransactionsRepository.save(
      this.bonusTransactionsRepository.create({
        userId: user.id,
        amount: Number(amount.toFixed(2)),
        type: BonusTransactionType.ADMIN_ADJUSTMENT,
        description,
      }),
    );
  }
}

function description_for_expire(orderId: number): string {
  return `Сгорание баллов за отменённый заказ #${orderId}`;
}
