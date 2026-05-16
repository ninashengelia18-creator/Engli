// Lightweight smoke-test runner for Engli. Boots the already-built
// Next.js production server, polls /api/health (if present) or the root
// for readiness, then runs the node:test suites in this directory.
//
// Why not Playwright? — these checks only need server-rendered HTML and
// API responses, and we want zero browser-binary install in CI. node:test
// + fetch is enough to catch routing breakage, auth redirects, and API
// contract regressions.

import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readdir } from 'node:fs/promises';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..');
const PORT = process.env.SMOKE_PORT ? Number(process.env.SMOKE_PORT) : 3100;
const BASE = `http://127.0.0.1:${PORT}`;

const env = {
  ...process.env,
  PORT: String(PORT),
  NODE_ENV: 'production',
  // Provide dummy values so server-side modules instantiate without crashing.
  // No real network calls happen during these smoke tests.
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_dummy',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy',
  STRIPE_PRICE_MONTHLY: process.env.STRIPE_PRICE_MONTHLY || 'price_dummy_monthly',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'sk-ant-dummy',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || BASE,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS || 'admin@example.com',
  CRON_SECRET: process.env.CRON_SECRET || 'smoke-test-cron-secret'
};

console.log(`[smoke] starting next start on :${PORT}`);
const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
  cwd: repoRoot,
  env,
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverLog = '';
server.stdout.on('data', (b) => { serverLog += b.toString(); });
server.stderr.on('data', (b) => { serverLog += b.toString(); });

let killed = false;
function shutdown(code) {
  if (killed) return;
  killed = true;
  try { server.kill('SIGTERM'); } catch {}
  process.exit(code);
}
process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));

async function waitForReady(maxMs = 45_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    if (server.exitCode !== null) {
      console.error('[smoke] server exited early. Output:\n' + serverLog);
      return false;
    }
    try {
      const r = await fetch(BASE + '/', { redirect: 'manual' });
      if (r.status < 500) return true;
    } catch {
      // not ready yet
    }
    await delay(500);
  }
  return false;
}

const ready = await waitForReady();
if (!ready) {
  console.error('[smoke] server failed to become ready in time. Output:\n' + serverLog);
  shutdown(1);
}

console.log('[smoke] server up, running tests…');

const files = (await readdir(here)).filter((f) => f.endsWith('.test.mjs')).sort();
process.env.SMOKE_BASE_URL = BASE;

const child = spawn(
  process.execPath,
  ['--test', ...files.map((f) => path.join(here, f))],
  { stdio: 'inherit', env: process.env, cwd: repoRoot }
);

child.on('exit', (code) => {
  console.log(`[smoke] tests exited with code ${code}`);
  shutdown(code ?? 1);
});
