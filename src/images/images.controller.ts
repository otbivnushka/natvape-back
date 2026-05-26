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
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ImagesService } from './images.service';
import { join } from 'path';

@Controller('api/images')
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Post('upload')
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
  async serve(@Param('filename') filename: string, @Res() res: Response) {
    const image = await this.imagesService.findByFilename(filename);
    if (!image) throw new NotFoundException('Image not found');

    const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
    res.sendFile(join(uploadDir, filename));
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.imagesService.deleteImage(+id).then(() => ({
      message: 'Image deleted',
    }));
  }
}
