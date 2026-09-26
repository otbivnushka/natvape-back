import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class AdjustBonusDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
