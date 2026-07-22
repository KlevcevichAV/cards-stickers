export interface Env {
  BOT_TOKEN: string;
  OWNER_CHAT_ID: string;
  WEBHOOK_SECRET: string;
}

interface TelegramUser {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
}

interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  from?: TelegramUser;
}

interface TelegramUpdate {
  message?: TelegramMessage;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('OK');
    }

    // Telegram sets this header on every webhook call when a secret_token
    // was registered via setWebhook — rejects requests from anyone who
    // guesses the URL and tries to spam forwardMessage into your DMs.
    if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== env.WEBHOOK_SECRET) {
      return new Response('Forbidden', { status: 403 });
    }

    const update = (await request.json()) as TelegramUpdate;
    const message = update.message;

    if (message) {
      const sender = message.from;
      const name = sender ? [sender.first_name, sender.last_name].filter(Boolean).join(' ') : 'неизвестно';
      const username = sender?.username ? `@${sender.username}` : '—';
      const info =
        `Сообщение от пользователя\n` +
        `id: ${sender?.id ?? 'неизвестно'}\n` +
        `username: ${username}\n` +
        `имя: ${name}`;

      await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.OWNER_CHAT_ID,
          text: info,
        }),
      });

      await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/forwardMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.OWNER_CHAT_ID,
          from_chat_id: message.chat.id,
          message_id: message.message_id,
        }),
      });
    }

    return new Response('OK');
  },
};
