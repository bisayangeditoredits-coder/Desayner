import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:3000';
const DEBUG_FAILURES = __ENV.DEBUG_FAILURES === '1';
const errors = new Rate('errors');

export const options = {
  vus: Number(__ENV.VUS || 25),
  duration: __ENV.DURATION || '45s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    errors: ['rate<0.01'],
  },
};

const paths = [
  '/projects',
  '/community',
  '/designers',
  '/api/projects?category=All&limit=24&offset=0',
  '/api/community?filter=All&limit=20',
  '/api/designers?category=All&sort=followers&page=1',
  '/api/trending',
  '/api/search?q=design&page=1',
  '/api/fonts?page=1',
  '/api/explore-colors?page=1&colors=5&hue=All',
];

export default function smokeLoad() {
  for (const path of paths) {
    const response = http.get(`${BASE_URL}${path}`);
    const ok = check(response, {
      [`${path} returned 200`]: (res) => res.status === 200,
    });

    errors.add(!ok);
    if (!ok && DEBUG_FAILURES) {
      const body = String(response.body || '').slice(0, 160).replace(/\s+/g, ' ');
      console.error(`${path} failed with status=${response.status} body=${body}`);
    }
    sleep(0.2);
  }
}
