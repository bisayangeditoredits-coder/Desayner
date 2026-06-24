import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { user, admin } = await getServerAuth(request);

    if (!user) {
      return NextResponse.json({ error: 'Strict Policy: You must be logged in to submit an application.' }, { status: 401 });
    }

    const body = await request.json();
    
    // Strict validation
    if (!body.job_id || !body.designer_name || !body.designer_email || !body.resume_url) {
      return NextResponse.json({ error: 'Missing required application fields' }, { status: 400 });
    }

    // Force the email to be the authenticated user's email for strict security
    const designerEmail = user.email || body.designer_email;

    // Very strict backend rate-limit / duplication check
    const { data: existingApp, error: checkError } = await admin
      .from('job_applications')
      .select('id')
      .eq('job_id', body.job_id)
      .eq('designer_email', designerEmail)
      .single();

    if (existingApp) {
      return NextResponse.json({ error: 'You have already applied for this job posting. Duplicate applications are not allowed.' }, { status: 429 }); // 429 Too Many Requests
    }

    const { data, error } = await admin
      .from('job_applications')
      .insert([
        {
          job_id: body.job_id,
          designer_name: body.designer_name,
          designer_email: designerEmail,
          portfolio_url: body.portfolio_url,
          cover_letter: body.cover_letter || null,
          resume_url: body.resume_url,
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, application: data[0] });
  } catch (error) {
    console.error('[Apply Job API Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit application. Please try again later.' },
      { status: 500 }
    );
  }
}
