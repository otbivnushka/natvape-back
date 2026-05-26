import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ImagesService } from './images.service';
import { join } from 'path';

@ApiTags('Images')
@Controller('api/images')
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload image (JPEG, PNG, GIF, WebP)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (max 5MB)',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          cb(new BadRequestException('Only images allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');
    return this.imagesService.saveFile(file);
  }

  @Get(':filename')
  @ApiOperation({ summary: 'Get image file by filename' })
  async serve(@Param('filename') filename: string, @Res() res: Response) {
    const image = await this.imagesService.findByFilename(filename);
    if (!image) throw new NotFoundException('Image not found');

    const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
    res.sendFile(join(uploadDir, filename));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete image by ID' })
  async delete(@Param('id') id: string) {
    return this.imagesService.deleteImage(+id).then(() => ({
      message: 'Image deleted',
    }));
  }
}
