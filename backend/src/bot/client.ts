import '../config';
export async function maxApi(endpoint: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') {
  const base = process.env.MAX_API_BASE || 'https://platform-api2.max.ru';
  if (!['https://platform-api.max.ru', 'https://platform-api2.max.ru'].includes(base)) throw new Error('Invalid MAX API host');
  if (!process.env.MAX_BOT_TOKEN) throw new Error('MAX_BOT_TOKEN missing');
  const response = await fetch(`${base}${endpoint}`, {
    method, headers: { Authorization: process.env.MAX_BOT_TOKEN, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000),
  });
  const data = await response.json() as any;
  if (!response.ok || data.success === false) throw new Error(`MAX API ${response.status}: ${data.code || 'request_failed'}`);
  return data;
}
