import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorySet } from './entities/story-set.entity';

@Injectable()
export class StoriesService {
  private baseUrl: string;

  constructor(
    @InjectRepository(StorySet)
    private storySetsRepository: Repository<StorySet>,
    configService: ConfigService,
  ) {
    this.baseUrl = configService.get<string>('BASE_URL') || 'http://localhost:3000';
  }

  async findAll() {
    const sets = await this.storySetsRepository.find({
      relations: { image: true, stories: { image: true } },
      order: { id: 'ASC', stories: { id: 'ASC' } },
    });

    return sets.map((set) => ({
      title: set.title,
      image: set.image
        ? `${this.baseUrl}/api/images/${set.image.filename}`
        : null,
      stories: set.stories.map((story) => {
        const result: Record<string, any> = {
          url: story.image
            ? `${this.baseUrl}/api/images/${story.image.filename}`
            : null,
          duration: story.duration,
        };
        if (story.title) {
          result.header = { heading: story.title };
          if (story.subtitle) {
            result.header.subheading = story.subtitle;
          }
        }
        return result;
      }),
    }));
  }
}
