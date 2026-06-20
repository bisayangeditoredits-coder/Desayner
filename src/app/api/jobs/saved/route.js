import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const { user, admin } = await getServerAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await admin
      .from('saved_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ saved_jobs: data });
  } catch (err) {
    console.error('[GET /api/jobs/saved]', err);
    return NextResponse.json({ error: 'Failed to fetch saved jobs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { job } = await request.json();
    if (!job || !job.id) return NextResponse.json({ error: 'Job details missing' }, { status: 400 });

    const { user, admin } = await getServerAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await admin
      .from('saved_jobs')
      .upsert(
        { user_id: user.id, job_id: job.id, job_data: job },
        { onConflict: 'user_id, job_id' }
      );

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[POST /api/jobs/saved]', err);
    return NextResponse.json({ error: 'Failed to save job' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ error: 'Job ID missing' }, { status: 400 });

    const { user, admin } = await getServerAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await admin
      .from('saved_jobs')
      .delete()
      .eq('user_id', user.id)
      .eq('job_id', jobId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/jobs/saved]', err);
    return NextResponse.json({ error: 'Failed to unsave job' }, { status: 500 });
  }
}
