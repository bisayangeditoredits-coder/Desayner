import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom Metrics
const errorRate = new Rate('errors');
const homepageResponse = new Trend('response_time_homepage');
const apiProjectsResponse = new Trend('response_time_api_projects');
const profileResponse = new Trend('response_time_profile');
const communityResponse = new Trend('response_time_community');

// Base Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  scenarios: {
    // Phase 1: 100 Concurrent Users
    warm_up_100: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    // Phase 2: 500 Concurrent Users (Triggered after 100 finishes)
    load_500: {
      executor: 'ramping-vus',
      startTime: '2m',
      startVUs: 0,
      stages: [
        { duration: '45s', target: 500 },
        { duration: '2m', target: 500 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
    // Phase 3: 1,000 Concurrent Users (Spike Test)
    spike_1000: {
      executor: 'ramping-vus',
      startTime: '5m30s',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 1000 },
        { duration: '2m', target: 1000 },
        { duration: '30s', target: 0 },
      ],
    },
    // Phase 4: 5,000 Concurrent Users (Stress Test)
    stress_5000: {
      executor: 'ramping-vus',
      startTime: '9m',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 5000 }, // Slow ramp up to 5k
        { duration: '3m', target: 5000 }, // Hold 5k
        { duration: '1m', target: 0 },    // Ramp down
      ],
    },
  },
  thresholds: {
    // 95% of requests must complete below 500ms
    http_req_duration: ['p(95)<500'],
    // Error rate must be less than 1%
    errors: ['rate<0.01'],
  },
};

// Simulate user behavior
export default function () {
  // 1. Visit Homepage
  let res = http.get(`${BASE_URL}/projects`);
  let success = check(res, {
    'Homepage status is 200': (r) => r.status === 200,
  });
  errorRate.add(!success);
  homepageResponse.add(res.timings.duration);
  
  sleep(1); // User reading the page

  // 2. Fetch Projects API (Edge + Redis Cached)
  res = http.get(`${BASE_URL}/api/projects?category=All&limit=24&offset=0`);
  success = check(res, {
    'API Projects status is 200': (r) => r.status === 200,
  });
  errorRate.add(!success);
  apiProjectsResponse.add(res.timings.duration);

  sleep(2); // User scrolling

  // 3. Visit a random Profile Page (Still using direct client DB queries)
  // Replace 'testuser' with an actual username from your database for accurate tests
  const usernames = ['testuser', 'demo', 'creator'];
  const randomUser = usernames[Math.floor(Math.random() * usernames.length)];
  
  res = http.get(`${BASE_URL}/profile/${randomUser}`);
  success = check(res, {
    'Profile status is 200': (r) => r.status === 200,
  });
  errorRate.add(!success);
  profileResponse.add(res.timings.duration);

  sleep(1.5); // User reading profile

  // 4. Visit Community Page (Direct DB Query)
  res = http.get(`${BASE_URL}/community`);
  success = check(res, {
    'Community status is 200': (r) => r.status === 200,
  });
  errorRate.add(!success);
  communityResponse.add(res.timings.duration);

  sleep(2); // Think time before starting over
}
