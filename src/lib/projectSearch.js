import { sanitizeFtsQuery } from './searchQuery';

export const PROJECT_LIST_SELECT =
  'id, title, thumbnail_url, cover_url, category, views_count, likes_count, saves_count, created_at, user_id, profiles!projects_user_id_fkey(username, full_name, avatar_url)';

/** Normalize raw user input into a safe Postgres FTS query string. */
export function parseSearchQuery(raw) {
  return sanitizeFtsQuery(raw);
}

/**
 * Build a Supabase query for published projects (home feed + search page).
 */
export function buildPublishedProjectsQuery(supabase, {
  ftsQuery = '',
  category = 'All',
  sort = 'newest',
  offset = 0,
  limit = 24,
  withCount = false,
}) {
  const selectOpts = withCount ? { count: 'exact' } : undefined;

  let query = supabase
    .from('projects')
    .select(PROJECT_LIST_SELECT, selectOpts)
    .eq('published', true);

  if (ftsQuery) {
    query = query.textSearch('fts', ftsQuery);
  }

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  if (sort === 'liked') {
    query = query.order('likes_count', { ascending: false });
  } else if (sort === 'viewed') {
    query = query.order('views_count', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  return query.range(offset, offset + limit - 1);
}
