import { Pool, PoolClient } from 'pg';
import { Request, Response, RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { config } from '../config';
import { initialData, mockUsers } from '../data/mockData';

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: Number(process.env.DB_POOL_MAX || 10),
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});
pool.on('error', () => console.error('PostgreSQL idle connection failed'));

// One row per entity, private entities reference a user. JSONB allows the MVP
// payloads to evolve without rewriting the API; ownership and keys are relational.
const schema = `
CREATE TABLE IF NOT EXISTS schema_migrations(version integer PRIMARY KEY, applied_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS users(id text PRIMARY KEY, profile jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS records(
  collection text NOT NULL,
  owner_id text REFERENCES users(id),
  scope text GENERATED ALWAYS AS (coalesce(owner_id, 'shared')) STORED,
  id text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  payload jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(collection, scope, id)
);
CREATE INDEX IF NOT EXISTS records_owner_collection ON records(owner_id, collection, position);
INSERT INTO schema_migrations(version) VALUES (1) ON CONFLICT DO NOTHING;
`;
const privateKeys = new Set(['bills', 'meterReadings', 'parkingPasses', 'carReports', 'neighborMessages', 'ticketVotes', 'meetingVotes', 'pollVotes']);
const singletonKeys = new Set(['complex', 'policeOfficer', 'garbageSchedule', 'ticketVotes', 'meetingVotes', 'pollVotes']);
const routeKeys: Record<string, string[]> = {
  complex: ['complex'], profile: [], users: [], outages: ['outages'],
  tickets: ['tickets', 'ticketVotes'], bills: ['bills'], meters: ['meterReadings'],
  parking: ['parkingPasses', 'carReports'], meetings: ['meetings', 'meetingVotes', 'complex'],
  neighbors: ['neighborMessages'], threads: ['threads'],
  directory: ['policeOfficer', 'staffDirectory', 'garbageSchedule'], marketplace: ['marketplace'],
  bot: ['tickets'],
  polls: ['polls', 'pollVotes'],
  announcements: ['announcements'],
};

export function isManager(profile: any): boolean {
  return profile?.role === 'admin' || profile?.role === 'manager' || profile?.role === 'chairman';
}

export function matchesUserScope(user: any, scopeType?: string, scopeId?: string | number): boolean {
  if (!scopeType || scopeType === 'complex' || !scopeId || scopeId === 'all') {
    return true;
  }
  if (scopeType === 'building') {
    return String(scopeId) === String(user?.building || '2');
  }
  if (scopeType === 'entrance') {
    return String(scopeId) === String(user?.entrance || '1');
  }
  return true;
}

export async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('smartcity:migrate'))");
    await client.query(schema);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

async function runMigration3(client: PoolClient) {
  // Update mockUsers with building, notifications, and privacy if missing
  for (const user of mockUsers) {
    const existing = (await client.query('SELECT profile FROM users WHERE id=$1', [user.id])).rows[0]?.profile;
    if (existing) {
      const merged = { ...user, ...existing };
      if (!merged.building) merged.building = user.building || 2;
      if (!merged.notifications) merged.notifications = user.notifications;
      if (!merged.privacy) merged.privacy = user.privacy;
      await client.query('UPDATE users SET profile=$1 WHERE id=$2', [JSON.stringify(merged), user.id]);
    }
  }

  // Seed announcements and polls if missing
  for (const collection of ['announcements', 'polls']) {
    const items = (initialData as any)[collection] || [];
    for (const [pos, item] of items.entries()) {
      await client.query(`
        INSERT INTO records(collection, owner_id, id, position, payload)
        VALUES($1, NULL, $2, $3, $4)
        ON CONFLICT(collection, scope, id) DO NOTHING
      `, [collection, item.id, pos, JSON.stringify(item)]);
    }
  }

  // Seed pollVotes for users
  for (const user of mockUsers) {
    const votes = (initialData as any).pollVotes || {};
    await client.query(`
      INSERT INTO records(collection, owner_id, id, position, payload)
      VALUES('pollVotes', $1, 'value', 0, $2)
      ON CONFLICT(collection, scope, id) DO NOTHING
    `, [user.id, JSON.stringify(votes)]);
  }

  // Ensure meterReadings have history
  const meterRows = (await client.query("SELECT owner_id, id, payload FROM records WHERE collection='meterReadings'")).rows;
  for (const row of meterRows) {
    if (!row.payload.history || row.payload.history.length === 0) {
      const seedItem = (initialData.meterReadings as any[]).find(m => m.id === row.id);
      if (seedItem?.history) {
        row.payload.history = seedItem.history;
        await client.query("UPDATE records SET payload=$1 WHERE collection='meterReadings' AND scope=$2 AND id=$3",
          [JSON.stringify(row.payload), row.owner_id || 'shared', row.id]);
      }
    }
  }

  await client.query('INSERT INTO schema_migrations(version) VALUES (3) ON CONFLICT DO NOTHING');
}

export async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('smartcity:seed'))");
    // Once-only seed: restarting or reseeding never restores deleted demo records.
    if ((await client.query('SELECT 1 FROM schema_migrations WHERE version=2')).rowCount) {
      if (!(await client.query('SELECT 1 FROM schema_migrations WHERE version=3')).rowCount) {
        await runMigration3(client);
      }
      await client.query('COMMIT'); return;
    }
    for (const user of mockUsers) {
      await client.query('INSERT INTO users VALUES ($1,$2) ON CONFLICT DO NOTHING', [user.id, user]);
    }
    for (const [collection, value] of Object.entries(initialData)) {
      if (['userProfile', 'users', 'activeUserId'].includes(collection)) continue;
      const owners = privateKeys.has(collection) ? mockUsers : [null];
      for (const user of owners) {
        const values = Array.isArray(value) ? value : [value];
        for (const [position, original] of values.entries()) {
          const payload: any = structuredClone(original);
          delete payload.userVoted;
          delete payload.userVotedSlotId;
          if (collection === 'parkingPasses' && user) payload.spotNumber = user.parkingSpot.split(' ')[0];
          await put(client, collection, user?.id || null, payload.id || 'value', position, payload);
        }
      }
    }
    await client.query('INSERT INTO schema_migrations(version) VALUES (2)');
    await runMigration3(client);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

async function put(client: PoolClient, collection: string, owner: string | null, id: string, position: number, payload: unknown) {
  await client.query(`INSERT INTO records(collection, owner_id, id, position, payload) VALUES($1,$2,$3,$4,$5)
    ON CONFLICT(collection,scope,id) DO UPDATE SET payload=excluded.payload, position=excluded.position, updated_at=now()`,
  [collection, owner, id, position, JSON.stringify(payload)]);
}

function serialized(collection: string, value: any) {
  const entries = singletonKeys.has(collection) ? [value] : value;
  return entries.map((entry: any, position: number) => {
    const payload = JSON.parse(JSON.stringify(entry));
    if (collection === 'tickets') delete payload.userVoted;
    if (collection === 'meetings') delete payload.userVotedSlotId;
    return { id: entry.id || 'value', position, payload };
  });
}

// The existing synchronous domain handlers run inside a database transaction.
// Lock only the mutated collection/scope, across all API replicas. No global state.
// Responses are sent AFTER commit, so a failed write cannot appear successful.
export function route(handler: (req: Request, res: Response, db: any) => unknown): RequestHandler {
  return async (req, res) => {
    let client: PoolClient | undefined;
    try {
      if (!config.demo) { res.status(403).json({ error: 'Демо-доступ отключён. Требуется подключить авторизацию MAX.' }); return; }
      client = await pool.connect();
      await client.query('BEGIN');
      await client.query("SET LOCAL lock_timeout = '5s'");
      const userId = req.header('X-Demo-User') || mockUsers[0].id;
      const users = (await client.query('SELECT profile FROM users ORDER BY id DESC')).rows.map(r => r.profile);
      const profile = users.find(u => u.id === userId);
      if (!profile) {
        await client.query('ROLLBACK');
        res.status(401).json({ error: 'Неизвестный тестовый пользователь' }); return;
      }
      const key = req.path.split('/')[2];
      const collections = routeKeys[key] || [];
      const writing = !['GET', 'HEAD'].includes(req.method);
      if (writing) {
        // Always lock in a stable order to avoid deadlocks.
        for (const collection of [...collections].sort()) {
          const scope = privateKeys.has(collection) ? userId : 'shared';
          await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${collection}:${scope}`]);
        }
      }
      const rows = (await client.query(`SELECT collection, id, payload FROM records
        WHERE collection = ANY($1::text[]) AND (owner_id IS NULL OR owner_id=$2)
        ORDER BY position, id`, [collections, userId])).rows;
      const initialProfileStr = JSON.stringify(profile);
      const db: any = { users, userProfile: profile, activeUserId: userId };
      for (const collection of collections) {
        const values = rows.filter(r => r.collection === collection).map(r => r.payload);
        db[collection] = singletonKeys.has(collection) ? (values[0] || {}) : values;
      }
      const before = new Map(collections.map(c => [c, serialized(c, db[c])]));
      for (const ticket of db.tickets || []) {
        Object.defineProperty(ticket, 'userVoted', { enumerable: true,
          get: () => db.ticketVotes?.[ticket.id],
          set: value => { if (value) db.ticketVotes[ticket.id] = value; else delete db.ticketVotes[ticket.id]; },
        });
      }
      for (const meeting of db.meetings || []) {
        Object.defineProperty(meeting, 'userVotedSlotId', { enumerable: true,
          get: () => db.meetingVotes[meeting.id],
          set: value => { db.meetingVotes[meeting.id] = value; },
        });
      }
      let result: unknown;
      let asJson = true;
      const reply = {
        status(code: number) { res.status(code); return reply; },
        setHeader(name: string, value: string) { res.setHeader(name, value); return reply; },
        json(value: unknown) { result = value; return reply; },
        send(value: unknown) { result = value; asJson = false; return reply; },
      } as unknown as Response;
      await handler(req, reply, db);
      if (writing && res.statusCode < 400) {
        if (JSON.stringify(db.userProfile) !== initialProfileStr) {
          await client.query('UPDATE users SET profile = $1 WHERE id = $2', [JSON.stringify(db.userProfile), userId]);
        }
        for (const collection of collections) {
          const owner = privateKeys.has(collection) ? userId : null;
          const previous = before.get(collection)!;
          const next = serialized(collection, db[collection]);
          for (const row of next) {
            const old = previous.find((r: any) => r.id === row.id);
            if (JSON.stringify(old) !== JSON.stringify(row)) await put(client, collection, owner, row.id, row.position, row.payload);
          }
          for (const old of previous) {
            if (!next.some((r: any) => r.id === old.id)) {
              await client.query('DELETE FROM records WHERE collection=$1 AND scope=$2 AND id=$3', [collection, owner || 'shared', old.id]);
            }
          }
        }
      }
      await client.query(res.statusCode < 400 ? 'COMMIT' : 'ROLLBACK');
      if (asJson) res.json(result); else res.send(result);
    } catch (error) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      console.error('API transaction failed', error instanceof Error ? error.name : 'UnknownError');
      if (!res.headersSent) res.status(503).json({ error: 'База данных временно недоступна. Попробуйте ещё раз.' });
    } finally { client?.release(); }
  };
}

export const newId = (prefix: string) => `${prefix}-${randomUUID()}`;
