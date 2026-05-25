import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddToCartDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  variantKey?: string;
}
