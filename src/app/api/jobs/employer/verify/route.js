import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const { user, admin } = await getServerAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await admin
      .from('employer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      throw error;
    }

    return NextResponse.json({ profile: profile || null });
  } catch (error) {
    console.error('[Employer Verify GET Error]', error);
    return NextResponse.json({ error: 'Failed to fetch verification status' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, admin } = await getServerAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.company_legal_name || !body.company_address || !body.company_country || !body.contact_person_name || !body.document_key) {
      return NextResponse.json({ error: 'Missing strictly required fields (including country and valid document)' }, { status: 400 });
    }

    // Check if profile already exists
    const { data: existing } = await admin
      .from('employer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Verification profile already exists and is pending review.' }, { status: 400 });
    }

    const { data, error } = await admin
      .from('employer_profiles')
      .insert([
        {
          user_id: user.id,
          company_legal_name: body.company_legal_name,
          business_registration_number: body.business_registration_number || null,
          company_address: body.company_address,
          company_country: body.company_country,
          contact_person_name: body.contact_person_name,
          document_url: body.document_key || null, // Saving the private R2 key here
          verification_status: 'pending_review'
        }
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, profile: data[0] });
  } catch (error) {
    console.error('[Employer Verify POST Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to submit verification' }, { status: 500 });
  }
}
