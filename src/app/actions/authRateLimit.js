'use server';

import { createRateLimit, Ratelimit, safeLimit } from '@/lib/rateLimit';
import { headers } from 'next/headers';

const authRateLimit = createRateLimit({
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: false,
  prefix: 'ratelimit:auth',
});

export async function checkAuthRateLimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return { success: true };
  }

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1';

  const { success, reset } = await safeLimit(authRateLimit, ip, {
    logPrefix: 'Auth RateLimit',
  });

  if (!success) {
    return {
      success: false,
      message: 'Too many signup attempts. Please try again later.',
      reset,
    };
  }

  return { success: true };
}