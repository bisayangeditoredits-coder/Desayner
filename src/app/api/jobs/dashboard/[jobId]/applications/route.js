import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';

export async function GET(request, { params }) {
  try {
    const { user, admin } = await getServerAuth(request);
    const { jobId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First verify the job belongs to this user
    const { data: job, error: jobError } = await admin
      .from('job_postings')
      .select('id')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found or unauthorized' }, { status: 404 });
    }

    // Fetch applications
    const { data: applications, error: appsError } = await admin
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (appsError) throw appsError;

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('[Job Applications API Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to load applications' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user, admin } = await getServerAuth(request);
    const { jobId } = await params;
    const { applicationId, status } = await request.json();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: job, error: jobError } = await admin
      .from('job_postings')
      .select('id')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update application status
    const { data, error } = await admin
      .from('job_applications')
      .update({ status })
      .eq('id', applicationId)
      .eq('job_id', jobId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, application: data });
  } catch (error) {
    console.error('[Update Application API Error]', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
