import { IsString, IsNumber, Min } from 'class-validator';

export class CreateVariantDto {
  @IsString()
  name: string;

  @IsString()
  value: string;

  @IsNumber()
  @Min(0)
  stock: number;
}
