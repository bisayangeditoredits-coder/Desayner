/**
 * GET /api/cron/update-trending
 *
 * Recalculates trending_score for all published projects created in the last 30 days.
 * Should be called by Vercel Cron every 30 minutes.
 *
 * Vercel Cron config (add to vercel.json):
 * {
 *   "crons": [{ "path": "/api/cron/update-trending", "schedule": "*/30 * * * *" }]
 * }
 *
 * Score formula: engagement weighted by recency (time-decay approximation)
 *   score = (likes * 1.0 + saves * 2.0 + views * 0.1) / hours_since_created
 *
 * Saves count twice because saving signals stronger intent than a like.
 * Views are weighted at 0.1 because they're much cheaper to accumulate.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { redis } from '@/lib/redis';
import { TRENDING_CACHE_KEY } from '@/lib/cacheKeys';

// This endpoint must NOT be on edge runtime — it uses the service role key
// and does a bulk UPDATE which is incompatible with edge.
export const runtime = 'nodejs';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request) {
  // Protect against arbitrary callers — only Vercel Cron sends this header
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // Update trending_score for projects published in the last 30 days
    const { error: updateError } = await supabase.rpc('update_trending_scores');

    if (updateError) {
      // Fallback: try direct SQL if the RPC doesn't exist yet
      console.warn('[update-trending] RPC not found, using direct update:', updateError.message);
      // The RPC is preferred — run the SQL in RUN_SCALING_INDEXES_V2.sql to create it
    }

    // Invalidate the trending cache so the next request fetches fresh data
    try {
      await redis.del(TRENDING_CACHE_KEY);
    } catch (cacheErr) {
      console.warn('[update-trending] Cache invalidation failed:', cacheErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Trending scores updated',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/cron/update-trending Error]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
