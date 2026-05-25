import { IsString, IsNumber, MinLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MinLength(1)
  label: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}
