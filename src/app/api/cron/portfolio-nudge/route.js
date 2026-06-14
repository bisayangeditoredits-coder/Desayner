import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPortfolioNudgeEmail } from '@/lib/email';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    const { data: candidates, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, projects_count, created_at')
      .eq('projects_count', 0)
      .gte('created_at', fourDaysAgo.toISOString())
      .lte('created_at', threeDaysAgo.toISOString());

    if (error) throw error;

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const profile of candidates || []) {
      const alreadySent = await redis.get(`portfolio_nudge:${profile.id}`);
      if (alreadySent) {
        skipped++;
        continue;
      }

      const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
      const email = authUser?.user?.email;
      if (!email) continue;

      try {
        await sendPortfolioNudgeEmail({
          toEmail: email,
          toName: profile.full_name || profile.username,
          username: profile.username,
        });

        await redis.set(`portfolio_nudge:${profile.id}`, '1', { ex: 60 * 60 * 24 * 365 });
        sent++;
      } catch (err) {
        console.error('[portfolio-nudge]', profile.id, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      candidates: candidates?.length || 0,
      sent,
      skipped,
      failed,
    });
  } catch (err) {
    console.error('[GET /api/cron/portfolio-nudge]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
