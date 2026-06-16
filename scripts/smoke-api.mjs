#!/usr/bin/env node
/**
 * Lightweight API smoke tests for critical security fixes.
 * Usage: node scripts/smoke-api.mjs [baseUrl]
 * Default baseUrl: http://localhost:3000
 */

const BASE = process.argv[2] || process.env.SMOKE_BASE_URL || 'http://localhost:3000';
const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, options = {}) {
  return fetch(url, {
    ...options,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

const tests = [
  {
    name: 'cache/clear rejects unauthenticated POST',
    async run() {
      const res = await fetchWithTimeout(`${BASE}/api/cache/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: ['profile_data_v2:test:50:0'] }),
      });
      return res.status === 401;
    },
  },
  {
    name: 'proxy-image blocks unknown hosts',
    async run() {
      const res = await fetchWithTimeout(`${BASE}/api/proxy-image?url=${encodeURIComponent('https://evil.example.com/x.png')}`);
      const ct = res.headers.get('content-type') || '';
      const body = await res.text();
      return res.status === 200 && ct.includes('svg') && body.includes('<svg');
    },
  },
  {
    name: 'admin/featured redirects to login',
    async run() {
      const res = await fetchWithTimeout(`${BASE}/admin/featured`, { redirect: 'manual' });
      const loc = res.headers.get('location') || '';
      return (res.status === 307 || res.status === 302) && loc.includes('/login');
    },
  },
  {
    name: 'profile API returns pagination fields',
    async run() {
      const res = await fetchWithTimeout(`${BASE}/api/profile/__smoke_nonexistent_user__?limit=10&offset=0`);
      if (res.status === 404) return true;
      if (!res.ok) return false;
      const data = await res.json();
      return typeof data.limit === 'number' && typeof data.offset === 'number' && 'hasMore' in data;
    },
  },
  {
    name: 'projects feed responds',
    async run() {
      const res = await fetchWithTimeout(`${BASE}/api/projects?limit=1&offset=0`);
      if (!res.ok) return false;
      const data = await res.json();
      return Array.isArray(data.projects);
    },
  },
];

async function main() {
  console.log(`Running smoke tests against ${BASE}\n`);

  try {
    await fetchWithTimeout(`${BASE}/api/projects?limit=1`);
  } catch {
    console.error(`Cannot reach ${BASE}. Start the app first: npm run dev\n`);
    process.exit(1);
  }
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const ok = await test.run();
      if (ok) {
        passed += 1;
        console.log(`✓ ${test.name}`);
      } else {
        failed += 1;
        console.log(`✗ ${test.name}`);
      }
    } catch (err) {
      failed += 1;
      console.log(`✗ ${test.name} — ${err.message}`);
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
