import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';
import { RatesService } from './rates.service';

export class CreateRateDto {
  @IsNumber()
  userId: number;

  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  value: number;
}

@ApiTags('Rates')
@Controller('api/rates')
export class RatesController {
  constructor(private ratesService: RatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update a rate (1-5)' })
  async create(@Body() dto: CreateRateDto) {
    return this.ratesService.upsert(dto.userId, dto.productId, dto.value);
  }
}
