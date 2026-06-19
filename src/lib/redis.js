import { Redis } from '@upstash/redis';

let redisClient;

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      // Batch multiple commands issued in the same tick into a single HTTP request.
      // This is especially effective on routes that call redis.get + redis.set or
      // redis.del multiple times (e.g. feed cache reads + invalidation on mutations).
      enableAutoPipelining: true,
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
