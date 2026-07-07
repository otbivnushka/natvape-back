import { IsString, IsNumber, IsBoolean, IsOptional, IsIn } from 'class-validator';

export class CreateCategoryAttributeDto {
  @IsNumber()
  categoryId: number;

  @IsString()
  name: string;

  @IsString()
  key: string;

  @IsString()
  @IsIn(['number', 'string', 'select'])
  type: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;
}
