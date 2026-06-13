import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email }]);

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ message: 'Already subscribed' }, { status: 200 });
      }
      console.error('Newsletter subscribe error:', error);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Subscribed successfully' }, { status: 200 });
  } catch (err) {
    console.error('Subscribe catch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
