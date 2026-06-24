import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client strictly for fetching public approved jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CACHE_HEADERS = {
  'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    // We only support 'All' right now for minimalism, but keep category for future use
    const category = (searchParams.get('category') || '').trim();

    // Pagination parameters
    const limit = parseInt(searchParams.get('limit') || '24', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let dbQuery = supabase
      .from('job_postings')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Optional: Add simple search on title or company if requested
    if (query) {
      dbQuery = dbQuery.or(`title.ilike.%${query}%,company.ilike.%${query}%`);
    }

    const { data: jobs, error } = await dbQuery;

    if (error) {
      throw error;
    }

    const categories = ['All'];

    return NextResponse.json(
      {
        jobs: jobs || [],
        categories,
        nextCursor: jobs?.length === limit ? offset + limit : null,
        source: 'Desayner Job Board',
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[Jobs API Error]', error);
    return NextResponse.json(
      { error: 'Failed to load jobs.', jobs: [], categories: [] },
      { status: 500 }
    );
  }
}
