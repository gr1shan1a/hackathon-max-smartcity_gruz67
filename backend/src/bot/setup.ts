import { config } from '../config';
import { maxApi } from './client';
import { commands } from './handler';
import { pool } from '../db/store';
async function setup() {
  if (!config.appUrl.startsWith('https://') || !process.env.MAX_WEBHOOK_SECRET) throw new Error('HTTPS MINI_APP_URL and MAX_WEBHOOK_SECRET required');
  const me = await maxApi('/me');
  const webhookUrl = new URL('/api/bot/webhook', config.appUrl).toString();
  const subscriptions = await maxApi('/subscriptions');
  const other = subscriptions.subscriptions?.filter((s: any) => s.url !== webhookUrl) || [];
  if (other.length) throw new Error('Other webhook subscriptions exist. Review them before replacing.');
  const health = await fetch(new URL('/api/health', config.appUrl), { signal: AbortSignal.timeout(15000) });
  if (!health.ok || (await health.json() as any).database !== 'postgresql') throw new Error('Public app healthcheck failed');
  const probe = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Max-Bot-Api-Secret': process.env.MAX_WEBHOOK_SECRET }, body: JSON.stringify({ update_type: 'connection_check' }), signal: AbortSignal.timeout(15000) });
  if (!probe.ok) throw new Error('Public webhook check failed');
  await maxApi('/subscriptions', { url: webhookUrl, update_types: ['bot_started','message_created','message_callback'], secret: process.env.MAX_WEBHOOK_SECRET });
  try { await maxApi('/me/commands', { commands }, 'PATCH'); }
  catch (error) {
    // Older still-supported MAX host exposes the command menu through PATCH /me.
    if (error instanceof Error && /404|405/.test(error.message)) await maxApi('/me', { commands }, 'PATCH');
    else throw error;
  }
  const verified = await maxApi('/subscriptions');
  console.log(JSON.stringify({ bot: me.username, app: config.appUrl, subscriptions: verified.subscriptions, commands: commands.map(c=>c.name) }, null, 2));
}
setup().catch(error => { console.error(error instanceof Error ? error.message : 'Bot setup failed'); process.exitCode=1; }).finally(()=>pool.end());
