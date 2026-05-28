async function sendTelegramMessage(
  chatId: number,
  text: string,
  extra: Record<string, unknown> = {},
): Promise<boolean> {
  try {
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

    const res = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.description || res.statusText);
    return true;
  } catch (error) {
    console.error('Send message error: ', (error as Error).message);
    return false;
  }
}

export { sendTelegramMessage };
