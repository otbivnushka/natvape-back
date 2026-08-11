import { Order } from '../orders/entities/order.entity';

function formatDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function buildOrderMessage(order: Order): string {
  const lines: string[] = [];

  lines.push(`Новый заказ #${order.id}`);
  lines.push('');

  const userName = order.user?.name ?? `#${order.userId}`;
  const userTag = order.user?.telegramUsername
    ? `@${order.user.telegramUsername}`
    : null;
  lines.push(`Клиент: ${userName}${userTag ? ` (${userTag})` : ''}`);

  lines.push(`Дата: ${formatDate(order.createdAt)}`);

  const method = order.deliveryMethod === 'delivery' ? 'Курьер' : 'Самовывоз';
  lines.push(`Способ: ${method}`);

  if (order.address) {
    lines.push(`Адрес: ${order.address.label}`);
  }

  if (order.deliveryTime) {
    lines.push(`Время: ${order.deliveryTime}`);
  }

  if (order.comment) {
    lines.push(`Комментарий: ${order.comment}`);
  }

  lines.push('');
  lines.push('Товары:');

  (order.items ?? []).forEach((item, i) => {
    const variant = item.variantName ? ` (${item.variantName})` : '';
    const sum = Number(item.price) * item.quantity;
    lines.push(
      `${i + 1}. ${item.productName}${variant} x ${item.quantity} = ${sum} руб`,
    );
  });

  lines.push('');
  lines.push(`Итого: ${Number(order.total)} руб`);

  return lines.join('\n');
}

export function buildIncomeOrderMessage(order: Order): string {
  const lines: string[] = [];

  lines.push(`Заказ #${order.id}`);

  const userName = order.user?.name ?? `#${order.userId}`;

  lines.push(`Клиент: ${userName}`);

  const method = order.deliveryMethod === 'delivery' ? 'Курьер' : 'Самовывоз';
  lines.push(`Способ: ${method}`);

  if (order.address) {
    lines.push(`Адрес: ${order.address.label}`);
  }

  if (order.comment) {
    lines.push(`Комментарий: ${order.comment}`);
  }

    if (order.total) {
    lines.push(`Цена: ${order.total}`);
  }

  if (order.actualPrice) {
    lines.push(`Фактическая цена: ${order.actualPrice}`);
  }

  return lines.join('\n');
}
