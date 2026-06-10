import { IsString, IsNumber, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePickupAddressDto {
  @IsString()
  @MinLength(1)
  label: string;

  @Type(() => Number)
  @IsNumber()
  lat: number;

  @Type(() => Number)
  @IsNumber()
  lng: number;
}
