import { createHash, timingSafeEqual } from 'node:crypto';
import { RequestHandler } from 'express';
import { pool } from '../db/store';
import { maxApi } from './client';
import { buildReply, parseUpdate } from './handler';

export async function migrateBot() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('smartcity:bot-migrate'))");
    await client.query(`CREATE TABLE IF NOT EXISTS bot_updates (
    id text PRIMARY KEY, payload jsonb NOT NULL, status text NOT NULL DEFAULT 'pending',
    attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(),
    received_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, error text
  ); CREATE INDEX IF NOT EXISTS bot_updates_pending ON bot_updates(available_at) WHERE status='pending';`);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export const webhook: RequestHandler = async (req, res) => {
  const secret = process.env.MAX_WEBHOOK_SECRET;
  const supplied = req.header('X-Max-Bot-Api-Secret') || '';
  if (!secret || Buffer.byteLength(secret) !== Buffer.byteLength(supplied) || !timingSafeEqual(Buffer.from(secret), Buffer.from(supplied))) {
    res.status(403).json({ error: 'Invalid webhook secret' }); return;
  }
  if (!parseUpdate(req.body)) { res.json({ success: true, ignored: true }); return; }
  const update = req.body;
  const identity = update.callback?.callback_id || update.message?.body?.mid || JSON.stringify(update);
  const id = createHash('sha256').update(`${update.update_type}:${identity}`).digest('hex');
  try {
    await pool.query('INSERT INTO bot_updates(id,payload) VALUES($1,$2) ON CONFLICT DO NOTHING', [id, update]);
    res.json({ success: true });
  } catch { res.status(503).json({ error: 'Queue unavailable' }); }
};

export function startBotWorker() {
  if (process.env.MAX_BOT_ENABLED !== 'true') return async () => {};
  let stopped = false;
  let running: Promise<void> | undefined;
  async function tick() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const job = (await client.query("SELECT * FROM bot_updates WHERE status='pending' AND available_at<=now() ORDER BY available_at,received_at LIMIT 1 FOR UPDATE SKIP LOCKED")).rows[0];
      if (!job) { await client.query('COMMIT'); return; }
      const event = parseUpdate(job.payload);
      try {
        if (event) {
          const reply = await buildReply(event.command);
          // Callback answer edits the existing menu; regular events send a reply.
          if (event.callbackId) await maxApi(`/answers?callback_id=${encodeURIComponent(event.callbackId)}`, { message: reply });
          else await maxApi(`/messages?chat_id=${event.chatId}`, reply);
        }
        await client.query("UPDATE bot_updates SET status='sent', sent_at=now(), attempts=attempts+1, error=NULL WHERE id=$1", [job.id]);
        console.log('[MAX Bot] Event delivered', job.id.slice(0, 12));
      } catch (error) {
        const attempts = job.attempts + 1;
        await client.query("UPDATE bot_updates SET attempts=$2, status=$3, available_at=now()+($4 * interval '1 second'), error=$5 WHERE id=$1", [job.id, attempts, attempts >= 10 ? 'failed' : 'pending', Math.min(300, 2 ** attempts), error instanceof Error ? error.message : 'Send failed']);
        console.error('[MAX Bot] Delivery retry', job.id.slice(0,12), attempts);
      }
      await client.query('COMMIT');
    } catch { await client.query('ROLLBACK').catch(() => {}); console.error('[MAX Bot] Worker database error'); }
    finally { client.release(); }
  }
  const timer = setInterval(() => {
    if (!stopped && !running) running = tick().catch(() => console.error('[MAX Bot] Worker unavailable')).finally(() => { running = undefined; });
  }, 1000);
  console.log('[MAX Bot] Webhook worker enabled');
  return async () => { stopped = true; clearInterval(timer); await running; };
}
