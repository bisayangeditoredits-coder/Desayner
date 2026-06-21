/**
 * k6 Load Test — Projects Feed
 *
 * Simulates realistic user behavior:
 *   1. Load the projects feed (paginated)
 *   2. Browse a single project detail page
 *   3. Search for a project
 *
 * Usage:
 *   k6 run --vus 100 --duration 60s load-test/k6_projects.js
 *   k6 run --vus 500 --duration 5m  load-test/k6_projects.js   # heavy load
 *
 * Environment variables:
 *   BASE_URL  — defaults to https://desayner.com
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ── Config ──────────────────────────────────────────────────────────────────

const BASE = __ENV.BASE_URL || 'https://desayner.com';

export const options = {
  stages: [
    { duration: '30s', target: 50 },    // ramp up
    { duration: '2m',  target: 200 },   // sustained load
    { duration: '1m',  target: 500 },   // spike
    { duration: '30s', target: 0 },     // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<2000'],  // 95th < 800ms, 99th < 2s
    http_req_failed:   ['rate<0.01'],                 // <1% errors
    'feed_load_time':  ['p(95)<600'],
    'detail_load_time': ['p(95)<500'],
    'search_load_time': ['p(95)<700'],
  },
};

// ── Custom Metrics ──────────────────────────────────────────────────────────

const feedLoadTime   = new Trend('feed_load_time');
const detailLoadTime = new Trend('detail_load_time');
const searchLoadTime = new Trend('search_load_time');
const errorRate      = new Rate('error_rate');

// ── Helpers ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'Design', 'Illustration', 'Photography', 'Branding', '3D', 'Motion', 'UI/UX'];
const SEARCH_TERMS = ['logo', 'website', 'branding', 'app design', 'illustration', 'poster', 'landing page'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Main Scenario ───────────────────────────────────────────────────────────

export default function main() {
  // 1. Browse the project feed
  group('Feed — page 1', () => {
    const cat = randomItem(CATEGORIES);
    const res = http.get(
      `${BASE}/api/projects?category=${encodeURIComponent(cat)}&limit=24&offset=0&sort=newest`,
      { tags: { name: 'GET /api/projects' } }
    );

    feedLoadTime.add(res.timings.duration);
    const ok = check(res, {
      'feed status 200': (r) => r.status === 200,
      'feed has projects': (r) => {
        try { return JSON.parse(r.body).projects.length > 0; } catch { return false; }
      },
    });
    errorRate.add(!ok);
  });

  sleep(1 + Math.random() * 2); // simulate reading time

  // 2. Open a project detail page
  group('Project Detail', () => {
    // First grab a project ID from the feed
    const feedRes = http.get(
      `${BASE}/api/projects?category=All&limit=5&offset=0&sort=newest`,
      { tags: { name: 'GET /api/projects (for detail)' } }
    );

    let projectId = null;
    try {
      const projects = JSON.parse(feedRes.body).projects;
      if (projects && projects.length > 0) {
        projectId = randomItem(projects).id;
      }
    } catch { /* noop */ }

    if (projectId) {
      const detailRes = http.get(
        `${BASE}/api/projects/${projectId}`,
        { tags: { name: 'GET /api/projects/:id' } }
      );
      detailLoadTime.add(detailRes.timings.duration);
      const ok = check(detailRes, {
        'detail status 200': (r) => r.status === 200,
      });
      errorRate.add(!ok);
    }
  });

  sleep(2 + Math.random() * 3); // simulate viewing a project

  // 3. Search
  group('Search', () => {
    const q = randomItem(SEARCH_TERMS);
    const res = http.get(
      `${BASE}/api/search?q=${encodeURIComponent(q)}&page=1`,
      { tags: { name: 'GET /api/search' } }
    );

    searchLoadTime.add(res.timings.duration);
    const ok = check(res, {
      'search status 200': (r) => r.status === 200,
    });
    errorRate.add(!ok);
  });

  sleep(1 + Math.random() * 2);

  // 4. Browse designers (occasional)
  if (Math.random() < 0.3) {
    group('Designers Feed', () => {
      const res = http.get(
        `${BASE}/api/designers?sort=followers&page=1`,
        { tags: { name: 'GET /api/designers' } }
      );
      check(res, { 'designers status 200': (r) => r.status === 200 });
    });
    sleep(1);
  }

  // 5. Trending (occasional)
  if (Math.random() < 0.2) {
    group('Trending', () => {
      const res = http.get(
        `${BASE}/api/trending`,
        { tags: { name: 'GET /api/trending' } }
      );
      check(res, { 'trending status 200': (r) => r.status === 200 });
    });
    sleep(0.5);
  }
}
