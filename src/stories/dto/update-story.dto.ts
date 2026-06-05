import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStoryDto {
  @IsOptional()
  @IsNumber()
  imageId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(500)
  duration?: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;
}
