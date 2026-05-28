import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByTelegramId(telegramId: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { telegramId } });
  }

  async findByTelegramUsername(telegramUsername: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { telegramUsername } });
  }

  async findAllAdmins(): Promise<User[]> {
    return this.usersRepository.find({ where: { isAdmin: true } });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async create(data: Partial<User>): Promise<User> {
    return this.usersRepository.save(data);
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    await this.usersRepository.update(id, data);
    return this.usersRepository.findOne({ where: { id } });
  }
}
