import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from '../images/entities/image.entity';
import { StorySet } from './entities/story-set.entity';

@Injectable()
export class StoriesService {
  private baseUrl: string;

  constructor(
    @InjectRepository(StorySet)
    private storySetsRepository: Repository<StorySet>,
    configService: ConfigService,
  ) {
    this.baseUrl =
      configService.get<string>('BASE_URL') || 'http://localhost:3000';
  }

  private resolveImageUrl(image: Image | null): string | null {
    if (!image) return null;
    return `${this.baseUrl}/api/images/${image.filename}`;
  }

  async findAll() {
    const sets = await this.storySetsRepository.find({
      relations: { image: true, stories: { image: true } },
      order: { id: 'ASC', stories: { id: 'ASC' } },
    });

    return sets.map((set) => ({
      id: set.id,
      title: set.title,
      imageId: set.image?.id ?? null,
      image: this.resolveImageUrl(set.image),
      stories: set.stories.map((story) => {
        const result: Record<string, any> = {
          imageId: story.image?.id ?? null,
          url: this.resolveImageUrl(story.image),
          duration: story.duration,
        };
        if (story.title) {
          result.header = {
            heading: story.title,
            profileImage: this.resolveImageUrl(set.image),
          };
          if (story.subtitle) {
            result.header.subheading = story.subtitle;
          }
        }
        return result;
      }),
    }));
  }
}
