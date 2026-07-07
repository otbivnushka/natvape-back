import { IsNumber, IsString } from 'class-validator';

export class CreateProductAttributeDto {
  @IsNumber()
  attributeId: number;

  @IsString()
  value: string;
}
