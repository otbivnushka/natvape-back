import { IsString, IsOptional } from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  label?: string;
}
