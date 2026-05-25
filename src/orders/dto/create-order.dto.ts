import { IsString, IsOptional, IsIn, IsNumber } from 'class-validator';

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
}
