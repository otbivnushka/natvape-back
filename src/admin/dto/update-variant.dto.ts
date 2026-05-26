import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}
