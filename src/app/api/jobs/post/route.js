import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const { user, admin } = await getServerAuth(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. You must be logged in to post a job.' }, { status: 401 });
    }

    const body = await request.json();
    
    // Basic validation
    if (!body.title || !body.company || !body.location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert into job_postings with status 'pending'
    const { data, error } = await admin
      .from('job_postings')
      .insert([
        {
          title: body.title,
          company: body.company,
          location: body.location,
          currency: body.currency || 'USD',
          min_salary: body.min_salary ? parseInt(body.min_salary) : null,
          max_salary: body.max_salary ? parseInt(body.max_salary) : null,
          job_type: body.job_type,
          level: body.level,
          url: body.url || null, // URL is now optional since we have internal apply
          logo: body.logo || null,
          description: body.description || null,
          status: 'pending', // Explicitly pending for strict admin approval
          user_id: user.id,  // Link job to employer
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, job: data[0] });
  } catch (error) {
    console.error('[Post Job API Error]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit job. Please try again later.' },
      { status: 500 }
    );
  }
}
