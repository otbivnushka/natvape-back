import { IsString } from 'class-validator';

export class UpdateProductAttributeDto {
  @IsString()
  value: string;
}
