import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateColorDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  hex?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;
}
