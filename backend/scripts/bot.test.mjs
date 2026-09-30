import test, { after } from 'node:test';
import assert from 'node:assert/strict';
process.env.MINI_APP_URL = 'https://example.com';
process.env.MAX_BOT_USERNAME = 'se14409794_bot';
const { parseUpdate, buildReply, commands } = await import('../dist/bot/handler.js');
const { pool } = await import('../dist/db/store.js');
after(()=>pool.end());
test('MAX start, message and callback event formats', () => {
  assert.equal(parseUpdate({ update_type: 'bot_started', chat_id: 123 }).command, '/start');
  const update = { update_type: 'message_created', message: { sender: { is_bot: false }, recipient: { chat_type: 'dialog', chat_id: 123 }, body: { text: '/start@se14409794_bot payload' } } };
  assert.equal(parseUpdate(update).command, '/start');
  update.message.sender.is_bot = true; assert.equal(parseUpdate(update), null);
  update.message.sender.is_bot = false; update.message.recipient.chat_type='chat'; assert.equal(parseUpdate(update), null);
  assert.equal(parseUpdate({ update_type: 'message_callback', message: { recipient: { chat_id: 123 } }, callback: { callback_id: 'cb', payload: 'cmd_sos' } }).command, '/sos');
  assert.equal(parseUpdate({}), null);
});
test('commands generate MAX keyboard with HTTPS link and real open_app', async () => {
  assert.ok(commands.some(c=>c.name==='start'));
  for(const command of ['/start','/app','/bills','/sos','/help','unknown']) {
    const reply=await buildReply(command);
    assert.ok(reply.text.length > 10);
    const buttons=reply.attachments[0].payload.buttons.flat();
    assert.equal(buttons.find(b=>b.type==='open_app').web_app,'se14409794_bot');
    assert.match(buttons.find(b=>b.type==='link').url,/^https:\/\//);
    assert.ok(buttons.some(b=>b.payload==='cmd_tickets'));
  }
});
