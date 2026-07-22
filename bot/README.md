# sticards-bot

Telegram-бот обратной связи: пересылает вам (и только вам) каждое сообщение,
которое пишут боту пользователи. Работает как Cloudflare Worker — без
собственного сервера.

## 1. Создать бота

В Telegram напишите [@BotFather](https://t.me/BotFather):

```
/newbot
```

Следуйте подсказкам, в конце получите токен вида `123456:ABC-DEF...`.

Опционально задайте меню команд:

```
/setcommands
```

и отправьте:

```
start - Начать / что умеет бот
feedback - Оставить отзыв или предложение
bug - Сообщить об ошибке
help - Как связаться с разработчиком
```

(Команды — это просто пункты меню для пользователя. Сама пересылка работает
на любое сообщение, без разбора команд.)

## 2. Узнать свой chat_id

Напишите [@userinfobot](https://t.me/userinfobot) — он пришлёт ваш `Id`.
Это и есть `OWNER_CHAT_ID`.

## 3. Установить зависимости и авторизоваться в Cloudflare

```sh
cd bot
npm install
npx wrangler login
```

## 4. Задеплоить воркер

```sh
npm run deploy
```

Wrangler выведет URL вида `https://sticards-bot.<ваш-субдомен>.workers.dev`.

## 5. Задать секреты

```sh
npx wrangler secret put BOT_TOKEN
npx wrangler secret put OWNER_CHAT_ID
npx wrangler secret put WEBHOOK_SECRET
```

`WEBHOOK_SECRET` — произвольная строка, которую вы сами придумываете (например,
сгенерируйте: `openssl rand -hex 20`). Она нужна на следующем шаге.

## 6. Подключить webhook

Замените плейсхолдеры и выполните (например, через curl):

```sh
curl "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://sticards-bot.<ваш-субдомен>.workers.dev" \
  -d "secret_token=<WEBHOOK_SECRET>"
```

Проверить, что webhook встал:

```sh
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

## Готово

Теперь любое сообщение боту прилетает вам в личку с пометкой «Переслано от…».
Ответить пользователю напрямую через бота нельзя (это не требовалось) — но вы
видите, кто писал, и при необходимости можете написать ему сами.
