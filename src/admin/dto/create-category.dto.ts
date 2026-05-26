import { IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  key: string;

  @IsString()
  label: string;
}
