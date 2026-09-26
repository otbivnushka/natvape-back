import { IsNumber, IsString, IsOptional } from 'class-validator';

export class AdjustBonusDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
