import dotenv from 'dotenv';
import path from 'node:path';

// Resolve relative to this module in both src/ and dist/, independently of cwd.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
export const config = {
  databaseUrl: process.env.DATABASE_URL,
  port: Number(process.env.PORT || process.env.BACKEND_PORT || 3001),
  demo: process.env.DEMO_MODE === 'true',
  appUrl: process.env.MINI_APP_URL || '',
};
