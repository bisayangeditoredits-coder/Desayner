import { createClient } from '@supabase/supabase-js';
import JobsClientWrapper from './JobsClientWrapper';

// Initialize Supabase client strictly for fetching public approved jobs on the server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export const metadata = {
  title: 'Job Board | Desayner',
  description: 'Find premium design roles curated for top-tier creatives.',
};

export const revalidate = 60; // SSR/SSG caching for 60 seconds

export default async function JobsPage() {
  const PAGE_SIZE = 24;

  let initialJobs = [];

  try {
    const { data: jobs, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1);

    if (error) {
      console.error('[JobsPage SSR Error]', error);
    } else {
      initialJobs = jobs || [];
    }
  } catch (error) {
    console.error('[JobsPage SSR Exception]', error);
  }

  return <JobsClientWrapper initialJobs={initialJobs} />;
}
