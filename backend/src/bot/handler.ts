import { config } from '../config';
import { pool } from '../db/store';

export const commands = [
  { name: 'start', description: 'Открыть меню дома' },
  { name: 'app', description: 'Открыть мини-приложение' },
  { name: 'tickets', description: 'Заявки по дому' },
  { name: 'bills', description: 'Квитанции и показания' },
  { name: 'sos', description: 'Экстренная помощь' },
  { name: 'help', description: 'Помощь и команды' },
];

export function parseUpdate(update: any) {
  if (!update || typeof update !== 'object') return null;
  if (update.update_type === 'bot_started' && Number.isSafeInteger(update.chat_id)) {
    return { chatId: update.chat_id, command: '/start', callbackId: undefined as string | undefined };
  }
  if (update.update_type === 'message_created') {
    const message = update.message;
    if (!message || message.sender?.is_bot || message.recipient?.chat_type !== 'dialog') return null;
    const chatId = message.recipient?.chat_id;
    if (!Number.isSafeInteger(chatId)) return null;
    const command = String(message.body?.text || '').trim().split(/\s+/)[0].split('@')[0].toLowerCase();
    return { chatId, command, callbackId: undefined as string | undefined };
  }
  if (update.update_type === 'message_callback') {
    const chatId = update.message?.recipient?.chat_id;
    if (!Number.isSafeInteger(chatId) || typeof update.callback?.callback_id !== 'string') return null;
    const command = ({ cmd_sos: '/sos', cmd_tickets: '/tickets', cmd_bills: '/bills', cmd_help: '/help' } as Record<string,string>)[update.callback.payload] || '/help';
    return { chatId, command, callbackId: update.callback.callback_id as string };
  }
  return null;
}

export async function buildReply(command: string) {
  let text: string;
  switch (command) {
    case '/start':
      text = 'Здравствуйте! Это «Мой дом» — цифровой помощник ЖК «Северное Сияние».\n\nОткройте мини-приложение: заявки, квитанции, счётчики, собрания и парковка. Сейчас доступна демонстрация на тестовых данных.';
      break;
    case '/app': text = 'Откройте «Мой дом» кнопкой ниже. В демо можно переключаться между жильцом и председателем в разделе «Профиль».'; break;
    case '/tickets': {
      const rows = (await pool.query("SELECT payload FROM records WHERE collection='tickets' AND owner_id IS NULL AND payload->>'isPublic'='true' ORDER BY position LIMIT 100")).rows;
      const active = rows.map(r => r.payload).filter(t => t.status !== 'completed');
      text = `Заявки по дому (демо): ${active.length} активных.\n\n${active.slice(0, 5).map(t => `• ${t.title} — ${t.status}`).join('\n') || 'Активных заявок нет.'}\n\nПодать заявку и посмотреть подробности можно в мини-приложении.`;
      break;
    }
    case '/bills': text = 'Квитанции и показания находятся в мини-приложении → «Сервисы» → «Дом и платежи» → «Квитанции».\n\nСейчас используются тестовые лицевые счета, оплата демонстрационная. Реальные счета к вашему MAX-профилю ещё не привязаны.'; break;
    case '/sos': text = 'При угрозе жизни, пожаре или аварии звоните 112.\n\nКонтакты служб конкретного дома доступны в мини-приложении → «Контакты». В демонстрации номера служб являются тестовыми.'; break;
    default: text = 'Доступные команды:\n/start — меню дома\n/app — мини-приложение\n/tickets — заявки по дому\n/bills — квитанции и счётчики\n/sos — экстренная помощь\n/help — помощь';
  }
  return {
    text,
    attachments: [{ type: 'inline_keyboard', payload: { buttons: [
      [{ type: 'open_app', text: 'Открыть «Мой дом»', web_app: process.env.MAX_BOT_USERNAME || 'se14409794_bot' }],
      [{ type: 'link', text: 'Открыть в браузере', url: config.appUrl }],
      [{ type: 'callback', text: 'Заявки', payload: 'cmd_tickets' }, { type: 'callback', text: 'ЖКУ', payload: 'cmd_bills' }],
      [{ type: 'callback', text: 'SOS', payload: 'cmd_sos' }, { type: 'callback', text: 'Помощь', payload: 'cmd_help' }],
    ] } }],
  };
}
