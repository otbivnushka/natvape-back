import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { BonusService } from './bonus.service';

@ApiTags('Bonus')
@ApiBearerAuth()
@Controller('api/bonus')
@UseGuards(JwtAuthGuard)
export class BonusController {
  constructor(private readonly bonusService: BonusService) {}

  @Get()
  @ApiOperation({ summary: 'Get bonus balance and transaction history' })
  async getBonus(@CurrentUser() user: User) {
    const [balance, history] = await Promise.all([
      this.bonusService.getBalance(user.id),
      this.bonusService.getHistory(user.id),
    ]);

    return {
      balance: Number(balance.toFixed(2)),
      spendable: Math.floor(balance),
      history: history.map((tx) => ({
        id: tx.id,
        amount: Number(tx.amount),
        type: tx.type,
        orderId: tx.orderId,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
    };
  }
}
