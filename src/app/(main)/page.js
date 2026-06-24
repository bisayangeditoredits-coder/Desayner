import { createServerClient } from '@supabase/ssr';
import { buildPublishedProjectsQuery } from '@/lib/projectSearch';
import FeedClientWrapper from './FeedClientWrapper';

export const metadata = {
  title: 'Desayner | Curated Design Portfolio Platform',
  description: 'The premium portfolio platform for top-tier creatives to showcase their work and get hired.',
};

export const revalidate = 60; // Cache the home page feed for 60 seconds

export default async function HomePage() {
  const PAGE_SIZE = 24;
  let initialProjects = [];

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );

    const query = buildPublishedProjectsQuery(supabase, {
      ftsQuery: null,
      category: 'All',
      sort: 'newest',
      offset: 0,
      limit: PAGE_SIZE,
      cursor: null,
    });

    const { data, error } = await query;

    if (error) {
      console.error('[HomePage SSR Error]', error);
    } else {
      initialProjects = data || [];
    }
  } catch (error) {
    console.error('[HomePage SSR Exception]', error);
  }

  return <FeedClientWrapper initialProjects={initialProjects} />;
}
