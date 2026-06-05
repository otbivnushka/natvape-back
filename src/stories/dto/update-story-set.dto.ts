import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateStorySetDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsNumber()
  imageId?: number;
}
