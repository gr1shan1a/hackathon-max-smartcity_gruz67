import { migrate, seed, pool } from './store';
(async () => {
  try {
    await migrate();
    if (process.argv.includes('--seed')) await seed();
    console.log('Database ready');
  } finally { await pool.end(); }
})().catch(() => { console.error('Database setup failed'); process.exitCode = 1; });
