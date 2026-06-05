import { IsString, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateStoryDto } from './create-story.dto';

export class CreateStorySetDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  imageId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStoryDto)
  stories?: CreateStoryDto[];
}
