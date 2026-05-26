import { IsString, IsNumber, Min } from 'class-validator';

export class CreateColorDto {
  @IsString()
  name: string;

  @IsString()
  hex: string;

  @IsNumber()
  @Min(0)
  stock: number;
}
