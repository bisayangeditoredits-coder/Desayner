import { Redis } from '@upstash/redis';

// Ensure environment variables are set in .env
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export { redis };
export default redis;
