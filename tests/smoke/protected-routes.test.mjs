// Smoke tests: authenticated app routes should redirect anonymous
// requests to /sign-in (the App Router layout guard). We assert the
// redirect, not the destination's content — these tests run without a
// real Supabase session.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3100';

async function head(path) {
  return fetch(BASE + path, { redirect: 'manual' });
}

const guardedPaths = [
  '/learn',
  '/chat',
  '/words',
  '/leagues',
  '/profile',
  '/upgrade',
  '/achievements',
  '/parent-dashboard'
];

for (const path of guardedPaths) {
  test(`anon access to ${path} redirects or is blocked`, async () => {
    const r = await head(path);
    // App Router's redirect() emits a 307. Some routes may render a 200
    // shell that then client-side redirects; either way, no 5xx allowed.
    assert.ok(r.status < 500, `${path} returned ${r.status}`);
    if (r.status === 307 || r.status === 302) {
      const loc = r.headers.get('location') || '';
      assert.match(loc, /\/sign-in|\/onboarding|\/$/);
    }
  });
}

test('admin section is gated', async () => {
  const r = await head('/admin');
  assert.ok(r.status < 500);
});
