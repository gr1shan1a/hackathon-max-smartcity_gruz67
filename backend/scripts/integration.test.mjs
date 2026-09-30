import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });
const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const schema = `test_${Date.now()}`;
const connection = new URL(process.env.DATABASE_URL);
connection.searchParams.set('options', `-c search_path=${schema}`);
const children = new Map();
async function start(port) {
  const child = spawn(process.execPath, ['dist/server.js'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    env: { ...process.env, PORT: String(port), DATABASE_URL: connection.toString(), DEMO_MODE: 'true', MAX_BOT_ENABLED: 'false', MAX_WEBHOOK_SECRET: 'integration-test-secret' },
    stdio: 'ignore',
  });
  children.set(port, child);
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) throw new Error('Test server exited');
    try { if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) return; } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('Test server startup timeout');
}
async function stop(port) {
  const child = children.get(port);
  if (child && child.exitCode === null) { child.kill('SIGTERM'); await once(child, 'exit'); }
  children.delete(port);
}
async function request(path, { user = 'usr-47', method = 'GET', body, port = 3101 } = {}) {
  const response = await fetch(`http://127.0.0.1:${port}/api${path}`, {
    method, headers: { 'X-Demo-User': user, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}
before(async () => {
  await admin.query(`CREATE SCHEMA ${schema}`);
  await start(3101); await start(3102);
});
after(async () => {
  await Promise.all([...children.keys()].map(stop));
  await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end();
});
test('switch is per browser; unknown users rejected', async () => {
  assert.equal((await request('/users/switch', { method: 'POST', body: { userId: 'usr-01' } })).data.profile.id, 'usr-01');
  assert.equal((await request('/profile')).data.id, 'usr-47');
  assert.equal((await request('/profile', { user: 'usr-01', port: 3102 })).data.id, 'usr-01');
  assert.equal((await request('/users/switch', { method: 'POST', body: { userId: 'missing' } })).status, 404);
  assert.equal((await request('/profile', { user: 'missing' })).status, 401);
});
test('private data isolated and survives restart', async () => {
  assert.equal((await request('/bills/BILL-2026-09/pay', { method: 'POST' })).status, 200);
  assert.equal((await request('/bills', { user: 'usr-01' })).data[0].status, 'pending');
  await request('/meters', { method: 'POST', body: { meterId: 'mtr-1', value: 155 } });
  assert.equal((await request('/meters', { user: 'usr-01' })).data[0].currentValue, 146.1);
  const pass = await request('/parking/passes', { method: 'POST', body: { guestCarNumber: 'ТЕСТ 123' } });
  assert.equal(pass.status, 201);
  assert.equal((await request('/parking', { user: 'usr-01' })).data.passes.some(p => p.id === pass.data.id), false);
  await stop(3101); await start(3101);
  assert.equal((await request('/bills')).data[0].status, 'paid');
  assert.equal((await request('/meters')).data[0].currentValue, 155);
  assert.equal((await request('/parking')).data.passes.some(p => p.id === pass.data.id), true);
});
test('concurrent votes across replicas preserve totals and user choices', async () => {
  const before = (await request('/tickets')).data.find(t => t.id === 'TCK-139').upvotes;
  const votes = await Promise.all([
    request('/tickets/TCK-139/vote', { method: 'POST', body: { type: 'up' } }),
    request('/tickets/TCK-139/vote', { method: 'POST', user: 'usr-01', port: 3102, body: { type: 'up' } }),
  ]);
  assert.ok(votes.every(r => r.status === 200));
  assert.equal((await request('/tickets')).data.find(t => t.id === 'TCK-139').upvotes, before + 2);
  await request('/tickets/TCK-139/vote', { method: 'POST', body: { type: 'up' } });
  assert.equal((await request('/tickets')).data.find(t => t.id === 'TCK-139').userVoted, undefined);
  const other = (await request('/tickets', { user: 'usr-01' })).data.find(t => t.id === 'TCK-139');
  assert.equal(other.userVoted, 'up'); assert.equal(other.upvotes, before + 1);
  assert.equal((await request('/tickets/TCK-139/vote', { method: 'POST', body: { type: 'invalid' } })).status, 400);
});
test('meeting votes per user; invalid writes leave no changes', async () => {
  const route = '/meetings/OSS-2026-03/vote-slot';
  await request(route, { method: 'POST', body: { slotId: 'slot-1' } });
  await request(route, { user: 'usr-01', method: 'POST', body: { slotId: 'slot-3' } });
  assert.equal((await request('/meetings')).data[0].userVotedSlotId, 'slot-1');
  assert.equal((await request('/meetings', { user: 'usr-01' })).data[0].userVotedSlotId, 'slot-3');
  const before = (await request('/meetings')).data;
  assert.equal((await request(route, { method: 'POST', body: { slotId: 'missing' } })).status, 400);
  assert.deepEqual((await request('/meetings')).data, before);
});
test('ownership and deletes persist after seed/restart', async () => {
  const item = (await request('/marketplace', { method: 'POST', body: { title: 'Тест', price: 100 } })).data;
  assert.equal((await request(`/marketplace/${item.id}`, { user: 'usr-01', method: 'DELETE' })).status, 403);
  assert.equal((await request(`/marketplace/${item.id}`, { method: 'DELETE' })).status, 200);
  await request('/marketplace', { method: 'POST', body: { title: 'Сохраняется после перезапуска' } });
  await stop(3101); await start(3101);
  const items = (await request('/marketplace')).data;
  assert.equal(items.some(i => i.id === item.id), false);
  assert.equal(items.some(i => i.title === 'Сохраняется после перезапуска'), true);
});

test('webhook verifies secret and deduplicates persisted events', async () => {
  const url = 'http://127.0.0.1:3101/api/bot/webhook';
  const body = JSON.stringify({ update_type: 'bot_started', chat_id: 123, timestamp: 123 });
  assert.equal((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })).status, 403);
  const headers = { 'Content-Type': 'application/json', 'X-Max-Bot-Api-Secret': 'integration-test-secret' };
  for (let i=0; i<2; i++) assert.equal((await fetch(url, { method: 'POST', headers, body })).status, 200);
  const count = await admin.query(`SELECT count(*) FROM ${schema}.bot_updates`);
  assert.equal(Number(count.rows[0].count), 1);
  await stop(3101); await start(3101);
  assert.equal(Number((await admin.query(`SELECT count(*) FROM ${schema}.bot_updates WHERE status='pending'`)).rows[0].count), 1);
});

test('parking passes support future dates, validation, owner-only cancellation and restart', async () => {
  const validFrom = new Date(Date.now() + 2 * 86400000).toISOString();
  const created = await request('/parking/passes', { method: 'POST', body: { guestCarNumber: 'А123ВС 777', guestName: 'Гость на завтра', validHours: 4, validFrom } });
  assert.equal(created.status, 201);
  assert.equal(created.data.status, 'scheduled');
  assert.equal(created.data.validFrom, validFrom);
  assert.equal(new Date(created.data.validUntil) - new Date(validFrom), 4 * 3600000);
  assert.ok(created.data.qrCodeText.length > 25);
  for (const payload of [{ validHours: 0 }, { validHours: 100 }, { validFrom: 'invalid' }, { validFrom: '2000-01-01T00:00:00Z' }, { validFrom: '2026-10-01T10:00' }]) {
    assert.equal((await request('/parking/passes', { method: 'POST', body: { guestCarNumber: 'А123ВС', ...payload } })).status, 400);
  }
  assert.equal((await request(`/parking/passes/${created.data.id}/cancel`, { method: 'POST', user: 'usr-01' })).status, 404);
  await stop(3101); await start(3101);
  assert.equal((await request('/parking')).data.passes.find(p => p.id === created.data.id).validFrom, validFrom);
  assert.equal((await request(`/parking/passes/${created.data.id}/cancel`, { method: 'POST' })).data.status, 'cancelled');
  await stop(3101); await start(3101);
  assert.equal((await request('/parking')).data.passes.find(p => p.id === created.data.id).status, 'cancelled');
});

test('resident cannot invoke manager-only endpoints; manager can invoke them', async () => {
  // Resident (usr-47) attempts manager endpoints -> 403
  assert.equal((await request('/announcements', { method: 'POST', user: 'usr-47', body: { title: 'T', text: 'Txt' } })).status, 403);
  assert.equal((await request('/polls', { method: 'POST', user: 'usr-47', body: { title: 'T', options: ['A', 'B'] } })).status, 403);
  assert.equal((await request('/outages', { method: 'POST', user: 'usr-47', body: { title: 'T', service: 'water' } })).status, 403);
  assert.equal((await request('/meetings', { method: 'POST', user: 'usr-47', body: { title: 'T', date: '2026-10-15' } })).status, 403);
  assert.equal((await request('/tickets/TCK-139/status', { method: 'POST', user: 'usr-47', body: { status: 'in_progress' } })).status, 403);

  // Manager (usr-01) can create announcement
  const annRes = await request('/announcements', {
    method: 'POST', user: 'usr-01',
    body: { title: 'Опрессовка труб', text: 'Проверка отопления', scopeType: 'entrance', scopeId: '1', category: 'maintenance' }
  });
  assert.equal(annRes.status, 201);
  assert.ok(annRes.data.id.startsWith('ANN-'));

  // Manager can create poll
  const pollRes = await request('/polls', {
    method: 'POST', user: 'usr-01',
    body: { title: 'Установка шлагбаума', description: 'Выбор подрядчика', scopeType: 'complex', scopeId: 'all', options: ['Подрядчик А', 'Подрядчик Б'] }
  });
  assert.equal(pollRes.status, 201);
  assert.ok(pollRes.data.id.startsWith('POL-'));
});

test('territorial scope filters announcements and polls by entrance/building/complex', async () => {
  // Create an announcement for entrance 1
  await request('/announcements', {
    method: 'POST', user: 'usr-01',
    body: { title: 'Уборка подъезда 1', text: 'Только для 1 подъезда', scopeType: 'entrance', scopeId: '1' }
  });

  // Create an announcement for entrance 2
  await request('/announcements', {
    method: 'POST', user: 'usr-01',
    body: { title: 'Лифт подъезда 2', text: 'Только для 2 подъезда', scopeType: 'entrance', scopeId: '2' }
  });

  // usr-47 is in entrance 2, usr-01 is in entrance 1
  const dmitryAnn = (await request('/announcements', { user: 'usr-47' })).data;
  const marinaAnn = (await request('/announcements', { user: 'usr-01' })).data;

  assert.ok(dmitryAnn.some(a => a.title === 'Лифт подъезда 2'));
  assert.ok(!dmitryAnn.some(a => a.title === 'Уборка подъезда 1'));

  assert.ok(marinaAnn.some(a => a.title === 'Уборка подъезда 1'));
  assert.ok(!marinaAnn.some(a => a.title === 'Лифт подъезда 2'));
});

test('poll voting, double-voting prevention, and results tracking', async () => {
  const pollRes = await request('/polls', {
    method: 'POST', user: 'usr-01',
    body: { title: 'Тестовый опрос хакатона', options: ['Вариант 1', 'Вариант 2'], scopeType: 'complex', allowMultiple: false }
  });
  const pollId = pollRes.data.id;
  const opt1Id = pollRes.data.options[0].id;

  // Resident votes
  const voteRes = await request(`/polls/${pollId}/vote`, {
    method: 'POST', user: 'usr-47', body: { optionIds: [opt1Id] }
  });
  assert.equal(voteRes.status, 200);
  assert.equal(voteRes.data.options[0].votes, 1);
  assert.deepEqual(voteRes.data.userVotedOptionIds, [opt1Id]);

  // Repeated vote should return 409 Conflict
  const repeatVote = await request(`/polls/${pollId}/vote`, {
    method: 'POST', user: 'usr-47', body: { optionIds: [opt1Id] }
  });
  assert.equal(repeatVote.status, 409);

  // Poll list reflects the user vote
  const list = (await request('/polls', { user: 'usr-47' })).data;
  const pollInList = list.find(p => p.id === pollId);
  assert.deepEqual(pollInList.userVotedOptionIds, [opt1Id]);
  assert.equal(pollInList.options[0].votes, 1);
});

test('ticket lifecycle: resident edit/cancel when new, manager status transitions', async () => {
  // Resident creates ticket
  const createRes = await request('/tickets', {
    method: 'POST', user: 'usr-47', body: { title: 'Не горит лампа', description: 'На 12 этаже' }
  });
  assert.equal(createRes.status, 201);
  const ticketId = createRes.data.id;

  // Resident edits their own ticket
  const editRes = await request(`/tickets/${ticketId}`, {
    method: 'PUT', user: 'usr-47', body: { title: 'Не горит лампа на 12 этаже', description: 'Мерцает и гаснет' }
  });
  assert.equal(editRes.status, 200);
  assert.equal(editRes.data.title, 'Не горит лампа на 12 этаже');

  // Other resident cannot edit
  assert.equal((await request(`/tickets/${ticketId}`, { method: 'PUT', user: 'usr-01', body: { title: 'Взлом' } })).status, 403);

  // Manager updates status to in_progress with master assignment
  const statusRes = await request(`/tickets/${ticketId}/status`, {
    method: 'POST', user: 'usr-01',
    body: { status: 'in_progress', masterName: 'Электрик Смирнов И.В.', masterComment: 'Выехал на объект' }
  });
  assert.equal(statusRes.status, 200);
  assert.equal(statusRes.data.status, 'in_progress');
  assert.equal(statusRes.data.masterName, 'Электрик Смирнов И.В.');

  // Resident cannot cancel once in_progress
  assert.equal((await request(`/tickets/${ticketId}/cancel`, { method: 'POST', user: 'usr-47' })).status, 400);
});

test('profile settings can be updated while verified fields are immutable', async () => {
  // Attempting to modify verified immutable fields fails
  const badReq = await request('/profile', {
    method: 'PUT', user: 'usr-47',
    body: { name: 'Другой Человек' }
  });
  assert.equal(badReq.status, 400);

  // Updating editable settings succeeds
  const updateRes = await request('/profile', {
    method: 'PUT', user: 'usr-47',
    body: {
      phone: '+7 999 555-44-33',
      email: 'dmitry.kim@example.com',
      registeredCars: ['М777ММ777'],
      notifications: { outages: true, bills: false, polls: true },
      privacy: { hidePhone: true }
    }
  });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.data.phone, '+7 999 555-44-33');
  assert.equal(updateRes.data.email, 'dmitry.kim@example.com');
  assert.deepEqual(updateRes.data.registeredCars, ['М777ММ777']);
  assert.equal(updateRes.data.notifications.bills, false);
  assert.equal(updateRes.data.name, 'Ким Дмитрий Алексеевич'); // verified name unchanged

  // Restart to verify persistence in PostgreSQL
  await stop(3101); await start(3101);
  const reloaded = (await request('/profile', { user: 'usr-47' })).data;
  assert.equal(reloaded.phone, '+7 999 555-44-33');
  assert.equal(reloaded.email, 'dmitry.kim@example.com');
  assert.deepEqual(reloaded.registeredCars, ['М777ММ777']);
});

test('meter reading history persistence and double payment prevention', async () => {
  // Meter history
  const meterRes = await request('/meters', {
    method: 'POST', user: 'usr-47', body: { meterId: 'mtr-1', value: 160 }
  });
  assert.equal(meterRes.status, 200);
  assert.ok(meterRes.data.meter.history.length > 0);
  assert.equal(meterRes.data.meter.currentValue, 160);

  // Bill payment double-pay check (BILL-2026-08 is already paid)
  const payAlreadyPaid = await request('/bills/BILL-2026-08/pay', { method: 'POST', user: 'usr-47' });
  assert.equal(payAlreadyPaid.status, 400);
});

