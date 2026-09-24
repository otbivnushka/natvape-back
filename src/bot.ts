import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import TelegramBot from 'node-telegram-bot-api';

export function startDumbBot(app: INestApplication): TelegramBot {
  const configService = app.get(ConfigService);

  //const enabled = configService.get<string>('BOT_ENABLED', 'false');
  //if (enabled !== 'true');

  const token = configService.get<string>('BOT_TOKEN', '');
  if (!token) {
    console.error('BOT_TOKEN is not set');
  }

  const bot = new TelegramBot(token, { polling: true });
  const webAppUrl = configService.get<string>('FRONTEND_URL', '') + 'profile';

  bot.onText(/\/start/, (msg) => {
    void bot.sendMessage(msg.chat.id, 'Добро пожаловать!', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Открыть магазин',
              web_app: { url: webAppUrl },
            },
          ],
        ],
      },
    });
    
  });

  console.log('Dumb bot started');

  return bot;
}
