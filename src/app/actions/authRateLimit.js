'use server';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Strict rate limit for authentication: 5 attempts per 10 minutes
const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

export async function checkAuthRateLimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    // If Redis is not configured, bypass
    return { success: true };
  }

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
  
  const { success, reset } = await authRateLimit.limit(ip);
  
  if (!success) {
    return { 
      success: false, 
      message: `Too many signup attempts. Please try again later.`,
      reset
    };
  }
  
  return { success: true };
}
