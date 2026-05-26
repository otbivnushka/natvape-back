import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import sharp from 'sharp';
import { Image } from './entities/image.entity';

function randomStr(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

@Injectable()
export class ImagesService {
  private uploadDir: string;
  private baseUrl: string;

  constructor(
    @InjectRepository(Image)
    private imagesRepository: Repository<Image>,
    private configService: ConfigService,
  ) {
    this.uploadDir =
      this.configService.get<string>('UPLOAD_DIR') ||
      join(process.cwd(), 'uploads');
    this.baseUrl =
      this.configService.get<string>('BASE_URL') || 'http://localhost:3000';

    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File) {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Only images allowed');
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const filename = `${datePart}_${timePart}_${randomStr(4)}.webp`;
    const filePath = join(this.uploadDir, filename);

    const buffer = await sharp(file.buffer).webp({ quality: 80 }).toBuffer();

    const { size: size } = await sharp(buffer).metadata();

    await sharp(buffer).toFile(filePath);

    const image = this.imagesRepository.create({
      filename,
      originalName: file.originalname,
      size: size || 0,
    });

    const saved = await this.imagesRepository.save(image);

    return {
      id: saved.id,
      url: `${this.baseUrl}/api/images/${filename}`,
    };
  }

  async findByFilename(filename: string) {
    return this.imagesRepository.findOneBy({ filename });
  }

  async deleteImage(id: number) {
    const image = await this.imagesRepository.findOneBy({ id });
    if (!image) throw new NotFoundException('Image not found');

    const filePath = join(this.uploadDir, image.filename);
    await this.imagesRepository.remove(image);

    try {
      unlinkSync(filePath);
    } catch {
      // file already missing — ignore
    }
  }
}
