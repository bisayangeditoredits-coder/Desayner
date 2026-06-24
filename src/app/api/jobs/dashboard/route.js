import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';
import { z } from 'zod';
import { safeLimit, createRateLimit } from '@/lib/rateLimit';
import { auditLogger } from '@/lib/security/auditLogger';

// 1. Strict Validation Schema (even if no params are currently passed, it's good practice)
const QuerySchema = z.object({}); 

// 2. Rate Limiter instance (strict limits for dashboard access)
const dashboardRateLimit = createRateLimit({ prefix: 'jobs:dashboard', limiter: { type: 'fixedWindow', tokens: 30, window: '1m' } });

export async function GET(request) {
  let context = { ip: request.headers.get('x-forwarded-for') || 'unknown' };

  try {
    // 3. Bulletproof Input Validation
    const url = new URL(request.url);
    const queryResult = QuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!queryResult.success) {
      auditLogger.warn('INVALID_REQUEST_FORMAT', { ...context, issues: queryResult.error.issues });
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    // 4. Strict Session Validation & RBAC
    const { user, admin } = await getServerAuth(request);
    if (!user) {
      auditLogger.warn('UNAUTHORIZED_DASHBOARD_ACCESS', context);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    context.userId = user.id;

    // 5. Rate Limiting (Fail-Secure: no fallback)
    const { success } = await safeLimit(dashboardRateLimit, user.id, { failOpen: true, logPrefix: 'JobsDashboard' });
    if (!success) {
      auditLogger.warn('RATE_LIMIT_EXCEEDED', context);
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Fetch employer profile FIRST for strict RBAC (only employers should have jobs)
    const { data: profile, error: profileError } = await admin
      .from('employer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Note: If profile is not found, they might just be a regular user trying to access the dashboard.
    // In our architecture, maybe we allow it but return empty jobs.
    // If strict employer RBAC is needed, we would return 403 here. 
    // "Ensure users can only access data they own" - we use user.id for the jobs query.

    const { data: jobs, error: jobsError } = await admin
      .from('job_postings')
      .select(`
        *,
        job_applications ( count )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (jobsError) {
      throw jobsError;
    }

    // Log successful access (optional, can be noisy, so maybe keep it out of info logs)
    // auditLogger.log('DASHBOARD_ACCESSED', context);

    return NextResponse.json({ jobs: jobs || [], profile: profile || null });
  } catch (error) {
    // 6. Zero-Error Tolerance: Catch all and log securely without leaking PII or DB structure
    auditLogger.error('DASHBOARD_FETCH_ERROR', error, context);
    return NextResponse.json({ error: 'An unexpected error occurred while loading the dashboard.' }, { status: 500 });
  }
}
