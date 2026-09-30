import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
if (!process.env.MAX_BOT_TOKEN) throw new Error('MAX_BOT_TOKEN missing');
const response = await fetch('https://platform-api.max.ru/me', {
  headers: { Authorization: process.env.MAX_BOT_TOKEN }, signal: AbortSignal.timeout(15000),
});
if (!response.ok) throw new Error(`MAX token check: HTTP ${response.status}`);
const bot = await response.json();
console.log(JSON.stringify({ valid: true, username: bot.username, name: bot.first_name || bot.name }, null, 2));
