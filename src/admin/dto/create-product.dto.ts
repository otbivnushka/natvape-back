import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class VariantDto {
  @IsString()
  name: string;

  @IsString()
  value: string;

  @IsNumber()
  @Min(0)
  stock: number;
}

class ColorDto {
  @IsString()
  name: string;

  @IsString()
  hex: string;

  @IsNumber()
  @Min(0)
  stock: number;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  categoryId: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  doublePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsNumber()
  imageId?: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  badge?: string;

  @IsString()
  brand: string;

  @IsOptional()
  @IsString()
  variantLabel?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants?: VariantDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorDto)
  colors?: ColorDto[];
}
