import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      enableAutoPipelining: true,
    });
  }

  return redisClient;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop: keyof Redis) {
    const client = getRedis();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default redis;