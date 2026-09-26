import {
  IsString,
  IsOptional,
  IsIn,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsIn(['pickup', 'delivery'])
  deliveryMethod: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsNumber()
  addressId?: number;

  @IsOptional()
  @IsString()
  deliveryTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  bonusToUse?: number;
}
