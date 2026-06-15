import { Redis } from '@upstash/redis';

let redisClient;

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redisClient;
}

export const redis = new Proxy({}, {
  get(_target, prop) {
    const client = getRedis();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
