import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users/users.service';
import TelegramBot, { CallbackQuery } from 'node-telegram-bot-api';
import { isAdmin } from './utils/isAdmin';
import { AdminService } from './admin/admin.service';
import { buildOrderMessage } from './utils/buildOrderMessage';
import { Order } from './orders/entities/order.entity';
import { sendTelegramMessage } from './utils/sendTelegramMessage';
import { OrdersService } from './orders/orders.service';

const mailingState = new Map<
  number,
  { step: 'awaiting_image' | 'awaiting_text'; image?: string }
>();

export function startBot(app: INestApplication) {
  const configService = app.get(ConfigService);
  const usersService = app.get(UsersService);
  const adminService = app.get(AdminService);
  const orderService = app.get(OrdersService);

  const enabled = configService.get<string>('BOT_ENABLED', 'false');
  if (enabled !== 'true') return;

  const token = configService.get<string>('BOT_TOKEN', '');
  if (!token) {
    console.error('BOT_TOKEN is not set');
    return;
  }

  const bot = new TelegramBot(token, { polling: true });
  const webAppUrl = configService.get<string>('FRONTEND_URL', '') + 'profile';
  const frontendUrl = configService.get<string>('FRONTEND_URL', '');

  bot.onText(/\/start/, (msg) => {
    void bot.sendMessage(msg.chat.id, 'Добро пожаловать в NatVape!', {
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

  bot.onText(/\/auth/, (msg) => {
    void (async () => {
      const user = await usersService.findByTelegramId(msg.chat.id);
      if (!isAdmin(user)) return;

      await bot.sendMessage(msg.chat.id, 'Ты админ', {
        reply_markup: {
          keyboard: [
            [{ text: 'Заказы', style: 'success', icon_custom_emoji_id: '1' }],
            [{ text: 'Рассылка', style: 'danger', icon_custom_emoji_id: '2' }],
          ],
          resize_keyboard: true,
        },
      });
    })();
  });

  bot.onText(/\/makeadmin/, (msg) => {
    void (async () => {
      const user = await usersService.findByTelegramId(msg.chat.id);
      if (!isAdmin(user)) return;
      if (!msg.text) return;
      const telegramUsername = msg.text.split(' ')[1];
      if (!telegramUsername) return;
      await adminService.makeAdmin(telegramUsername);
      await bot.sendMessage(msg.chat.id, `${telegramUsername} теперь админ`);
    })();
  });

  bot.onText(/\/unmakeadmin/, (msg) => {
    void (async () => {
      const user = await usersService.findByTelegramId(msg.chat.id);
      if (!isAdmin(user)) return;
      if (!msg.text) return;
      const telegramUsername = msg.text.split(' ')[1];
      if (!telegramUsername) return;
      await adminService.removeAdmin(telegramUsername);
      await bot.sendMessage(msg.chat.id, `${telegramUsername} теперь не админ`);
    })();
  });

  bot.onText(/\/swap/, (msg) => {
    void (async () => {
      const user = await usersService.findByTelegramId(msg.chat.id);
      if (!isAdmin(user)) return;
      if (!msg.text) return;
      const telegramUsername = msg.text.split(' ')[1];
      if (!telegramUsername) return;
      const orderId = msg.text.split(' ')[2];
      if (!orderId) return;

      await adminService.swapOrder(telegramUsername, Number(orderId));
      await bot.sendMessage(
        msg.chat.id,
        `${telegramUsername} получил заказ #${orderId}`,
      );
    })();
  });

  bot.onText(/\/getorder/, (msg) => {
    void (async () => {
      const user = await usersService.findByTelegramId(msg.chat.id);
      if (!user || !isAdmin(user)) return;
      if (!msg.text) return;
      const orderId = msg.text.split(' ')[1];
      if (!orderId) return;

      const order = await orderService.findById(user.id, Number(orderId));
      await bot.sendMessage(msg.chat.id, `${buildOrderMessage(order)}`);
    })();
  });

  bot.onText(/\/ahelp/, (msg) => {
    void (async () => {
      const user = await usersService.findByTelegramId(msg.chat.id);
      if (!isAdmin(user)) return;

      await bot.sendMessage(
        msg.chat.id,
        `/makeadmin <telegramUsername> - сделать админом\n/unmakeadmin <telegramUsername> - сделать не админом\n/swap <telegramUsername> <orderId> - поменять заказ у пользователя\n/getorder <orderId> - получить заказ`,
      );
    })();
  });

  bot.onText(/Рассылка/, (msg) => {
    void (async () => {
      const user = await usersService.findByTelegramId(msg.chat.id);
      if (!isAdmin(user)) return;
      mailingState.set(msg.chat.id, { step: 'awaiting_image' });
      await bot.sendMessage(
        msg.chat.id,
        'Отправь изображение для рассылки (или просто текст, чтобы начать без картинки)',
      );
    })();
  });

  bot.on('photo', (msg) => {
    void (async () => {
      const state = mailingState.get(msg.chat.id);
      if (!state || state.step !== 'awaiting_image') return;

      const fileId = msg.photo![msg.photo!.length - 1].file_id;
      mailingState.set(msg.chat.id, { step: 'awaiting_text', image: fileId });
      await bot.sendMessage(
        msg.chat.id,
        'Текст для рассылки (отменить - напиши "отмена")',
      );
    })();
  });

  bot.on('message', (msg) => {
    void (async () => {
      if (!msg.text) return;
      const state = mailingState.get(msg.chat.id);
      if (!state) return;

      if (msg.text.toLowerCase() === 'отмена') {
        mailingState.delete(msg.chat.id);
        await bot.sendMessage(msg.chat.id, 'Рассылка отменена');
        return;
      }

      if (state.step === 'awaiting_image') {
        const allUsers = await usersService.findAll();
        mailingState.delete(msg.chat.id);
        let success = 0;
        let failed = 0;
        for (const u of allUsers) {
          try {
            await bot.sendMessage(Number(u.telegramId), msg.text);
            success++;
          } catch {
            failed++;
          }
        }
        await bot.sendMessage(
          msg.chat.id,
          `Отправлено успешно: ${success}\nНе отправлено: ${failed}`,
        );
        return;
      }

      if (state.step !== 'awaiting_text') return;

      const allUsers = await usersService.findAll();
      mailingState.delete(msg.chat.id);

      let success = 0;
      let failed = 0;
      for (const u of allUsers) {
        try {
          if (state.image) {
            await bot.sendPhoto(Number(u.telegramId), state.image, {
              caption: msg.text,
            });
          } else {
            await bot.sendMessage(Number(u.telegramId), msg.text);
          }
          success++;
        } catch {
          failed++;
        }
      }

      await bot.sendMessage(
        msg.chat.id,
        `Отправлено успешно: ${success}\nНе отправлено: ${failed}`,
      );
    })();
  });

  bot.onText(/Заказы/, (msg) => {
    void (async () => {
      const user = await usersService.findByTelegramId(msg.chat.id);
      if (!isAdmin(user)) return;
      const orders = await adminService.getSentOrders();
      if (!orders.length) {
        await bot.sendMessage(msg.chat.id, 'Нет заказов');
        return;
      }
      for (const order of orders) {
        await sendOrderMessageWithButtons(bot, frontendUrl, msg.chat.id, order);
      }
    })();
  });

  bot.on('callback_query', async (query) => {
    const chatId = query.message!.chat.id;
    const data = query.data!;
    const user = await usersService.findByTelegramId(chatId);
    if (!isAdmin(user)) return;

    switch (getCommand(data)) {
      case 'delete':
        await deleteOrder(bot, adminService, query, +getParam(data));
        break;
      case 'complete':
        await completeOrder(bot, adminService, query, +getParam(data));
        break;
      case 'check_all':
        await checkAllOrders(bot, adminService, query, +getParam(data));
        break;
      case 'ask':
        await askToWrite(bot, query, +getParam(data));
        break;
      default:
        console.log('idk');
    }
  });

  console.log('Bot started');
}

const getCommand = (input: string) => input.split(':')[0];
const getParam = (input: string) => input.split(':')[1];

async function deleteOrder(
  bot: TelegramBot,
  adminService: AdminService,
  query: CallbackQuery,
  orderId: number,
) {
  await adminService.deleteOrder(orderId);
  await bot.answerCallbackQuery(query.id, { text: 'Заказ удалён' });
  await bot.editMessageText('✅ Заказ #' + orderId + ' удалён', {
    chat_id: query.message!.chat.id,
    message_id: query.message!.message_id,
  });
}

async function completeOrder(
  bot: TelegramBot,
  adminService: AdminService,
  query: CallbackQuery,
  orderId: number,
) {
  await adminService.updateOrderStatus(orderId, { status: 'end' });
  await bot.answerCallbackQuery(query.id, { text: 'Заказ завершён' });
  await bot.editMessageText('✅ Заказ #' + orderId + ' завершён', {
    chat_id: query.message!.chat.id,
    message_id: query.message!.message_id,
  });
}

async function checkAllOrders(
  bot: TelegramBot,
  adminService: AdminService,
  query: CallbackQuery,
  userId: number,
) {
  const orders = await adminService.getAllOrdersByUserId(userId);
  if (!orders.length) {
    await bot.sendMessage(query.message!.chat.id, 'Нет заказов');
    return;
  }
  const lines: string[] = [`Все заказы (заказов ${orders.length}):`, ''];
  for (const order of orders) {
    lines.push(`Заказ #${order.id} — ${Number(order.total)} руб`);
    for (const item of order.items) {
      const variant = item.variantName ? ` (${item.variantName})` : '';
      const sum = Number(item.price) * item.quantity;
      lines.push(
        `  - ${item.productName}${variant} x ${item.quantity} = ${sum} руб`,
      );
    }
    lines.push(`${order.status === 'end' ? '✅ доставлен' : '⏳'}`);
    lines.push('');
  }
  await bot.sendMessage(query.message!.chat.id, lines.join('\n'));
}

async function askToWrite(
  bot: TelegramBot,
  query: CallbackQuery,
  userTelegramId: number,
) {
  const text = 'Напишите на аккаунт @NatManagerr чтобы уточнить заказ';
  const res = await sendTelegramMessage(userTelegramId, text);
  await bot.sendMessage(
    query.message!.chat.id,
    res ? '✅ Сообщение отправлено' : '✅ Сообщение не отправлено',
  );
}

function buildOrderKeyboard(
  order: Order,
  frontendUrl: string,
  canOpenProfile: boolean,
) {
  const lastRow = order.address?.label
    ? [
        {
          text: 'Y Maps',
          url: getYMapsLink(order.address?.label),
        },
        {
          text: 'Открыть заказ',
          web_app: { url: `${frontendUrl}admin/order/${order.id}` },
        },
      ]
    : [
        {
          text: 'Открыть заказ',
          web_app: { url: `${frontendUrl}admin/order/${order.id}` },
        },
      ];

  const firstRow = canOpenProfile
    ? [
        {
          text: 'Открыть профиль',
          url: `tg://user?id=${order.user.telegramId}`,
        },
        { text: 'Завершить заказ', callback_data: `complete:${order.id}` },
      ]
    : [
        {
          text: 'Попросить написать',
          callback_data: `ask:${order.user.telegramId}`,
        },
        { text: 'Завершить заказ', callback_data: `complete:${order.id}` },
      ];

  return {
    reply_markup: {
      inline_keyboard: [
        firstRow,
        [
          { text: 'Удалить заказ', callback_data: `delete:${order.id}` },
          {
            text: 'Посмотреть все заказы',
            callback_data: `check_all:${order.user.id}`,
          },
        ],
        lastRow,
      ],
    },
  };
}

function getYMapsLink(address: string) {
  const url = `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
  return url;
}

async function sendOrderMessageWithButtons(
  bot: TelegramBot,
  frontendUrl: string,
  chatId: number,
  order: Order,
) {
  try {
    await bot.sendMessage(
      chatId,
      buildOrderMessage(order),
      buildOrderKeyboard(order, frontendUrl, true),
    );
  } catch {
    await bot.sendMessage(
      chatId,
      buildOrderMessage(order),
      buildOrderKeyboard(order, frontendUrl, false),
    );
  }
}
