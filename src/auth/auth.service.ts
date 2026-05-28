import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { validate, parse } from '@telegram-apps/init-data-node';
import { UsersService } from '../users/users.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';

@Injectable()
export class AuthService {
  private readonly botToken: string;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.botToken = configService.get<string>('BOT_TOKEN', '');
  }

  async telegramAuth(dto: TelegramAuthDto) {
    if (!this.botToken) {
      throw new UnauthorizedException('BOT_TOKEN not configured');
    }

    let parsed: Record<string, unknown>;
    try {
      validate(dto.initData, this.botToken);
      parsed = parse(dto.initData);
    } catch {
      throw new UnauthorizedException('Invalid Telegram data');
    }

    const authDate = new Date(parsed.authDate as string).getTime();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    if (now - authDate > oneHour) {
      throw new UnauthorizedException('Auth data expired');
    }

    const tgUser = parsed.user as
      | {
          id: number;
          first_name?: string;
          last_name?: string;
          username?: string;
        }
      | undefined;

    if (!tgUser) {
      throw new UnauthorizedException('No user data in initData');
    }

    let user = await this.usersService.findByTelegramId(tgUser.id);

    if (!user) {
      user = await this.usersService.create({
        telegramId: tgUser.id,
        telegramUsername: tgUser.username ?? null,
        name:
          [tgUser.first_name, tgUser.last_name]
            .filter(Boolean)
            .join(' ')
            .trim() || 'User',
      });
    }

    const accessToken = this.jwtService.sign({ sub: user.id });

    const {
      cartItems: _cartItems,
      wishlistItems: _wishlistItems,
      orders: _orders,
      ...safeUser
    } = user;
    return { accessToken, user: safeUser };
  }
}
