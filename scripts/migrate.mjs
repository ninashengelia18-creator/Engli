// Run all SQL migrations against a Supabase Postgres database in order.
//
// Usage (PowerShell):
//   $env:DATABASE_URL = "postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres"
//   node scripts/migrate.mjs
//
// Or one-shot (bash):
//   DATABASE_URL="postgresql://..." node scripts/migrate.mjs

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

// Explicit order — schema first, then helpers (which reference tables),
// then seed data, then incremental migrations.
const ORDER = [
  '20260427_initial_schema.sql',
  '20260427_helper_functions.sql',
  '20260427_seed_data.sql',
  '20260428_more_lessons.sql',
  '20260428_onboarding.sql'
];

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL env var is not set.');
  console.error('In PowerShell: $env:DATABASE_URL = "postgresql://..."');
  process.exit(1);
}

const onDisk = new Set(readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')));
const missing = ORDER.filter((f) => !onDisk.has(f));
if (missing.length > 0) {
  console.error('Missing expected migration files:', missing);
  process.exit(1);
}
const extra = [...onDisk].filter((f) => !ORDER.includes(f));
if (extra.length > 0) {
  console.warn('Skipping unknown migration files (add to ORDER if needed):', extra);
}
const files = ORDER.filter((f) => existsSync(join(MIGRATIONS_DIR, f)));

console.log(`Found ${files.length} migration files:`);
files.forEach((f) => console.log(`  - ${f}`));
console.log();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();
console.log('Connected to database.\n');

for (const file of files) {
  const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
  process.stdout.write(`Running ${file}... `);
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('ok');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.log('FAILED');
    console.error(`\nMigration ${file} failed:`);
    console.error(err.message);
    await client.end();
    process.exit(1);
  }
}

console.log('\nAll migrations applied. Verifying...\n');

const verify = await client.query(`
  select 'tables' as kind, count(*)::int as n from information_schema.tables where table_schema = 'public'
  union all select 'worlds', count(*)::int from public.worlds
  union all select 'units', count(*)::int from public.units
  union all select 'lessons', count(*)::int from public.lessons
  union all select 'exercises', count(*)::int from public.exercises
  union all select 'achievements', count(*)::int from public.achievements
`);

console.table(verify.rows);

await client.end();
console.log('\nDone.');
