import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StoriesService } from './stories.service';

@ApiTags('Stories')
@Controller('api/stories')
export class StoriesController {
  constructor(private storiesService: StoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all story sets with stories' })
  async findAll() {
    return this.storiesService.findAll();
  }
}
