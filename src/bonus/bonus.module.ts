import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonusController } from './bonus.controller';
import { BonusService } from './bonus.service';
import { BonusTransaction } from './entities/bonus-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BonusTransaction])],
  controllers: [BonusController],
  providers: [BonusService],
  exports: [BonusService],
})
export class BonusModule {}
