import { createClient } from '@/lib/supabase/client';

/**
 * Supabase Full-Text Search Utility
 *
 * Uses PostgreSQL's built-in full-text search (tsvector/tsquery).
 * FREE — included in all Supabase plans.
 * Fast enough for 50k DAU. Upgrade to Typesense later if needed.
 *
 * Assumes your assets table has a generated tsvector column called
 * `fts` that indexes title, description, and tags.
 *
 * SQL to add to your Supabase table (run once in SQL Editor):
 * ─────────────────────────────────────────────────────────────
 * ALTER TABLE assets ADD COLUMN fts tsvector
 *   GENERATED ALWAYS AS (
 *     setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
 *     setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
 *     setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C')
 *   ) STORED;
 *
 * CREATE INDEX assets_fts_idx ON assets USING gin(fts);
 * ─────────────────────────────────────────────────────────────
 */

/**
 * Search assets using Supabase Full-Text Search.
 * @param {string} query - The search term from the user.
 * @param {object} options - Optional filters.
 * @returns {Promise<Array>} Matching asset rows.
 */
export async function searchAssets(query = '', options = {}) {
  const { category, type, isPremium, page = 1, perPage = 24 } = options;
  const supabase = createClient();

  let builder = supabase
    .from('assets')
    .select('*', { count: 'exact' })
    .order('downloads', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  // Full-text search — uses PostgreSQL's native tsvector
  if (query && query.trim() !== '') {
    builder = builder.textSearch('fts', query, {
      type: 'websearch',   // supports AND, OR, quotes, minus — same feel as Google
      config: 'english',
    });
  }

  // Optional filters
  if (category)          builder = builder.eq('category', category);
  if (type)              builder = builder.eq('type', type);
  if (isPremium != null) builder = builder.eq('is_premium', isPremium);

  const { data, error, count } = await builder;

  if (error) {
    console.error('[searchAssets] Error:', error.message);
    return { results: [], total: 0 };
  }

  return { results: data || [], total: count || 0 };
}

/**
 * Get trending/featured assets (no search query needed).
 * Used for the default dashboard view.
 */
export async function getTrendingAssets({ page = 1, perPage = 24, category, type } = {}) {
  const supabase = createClient();

  let builder = supabase
    .from('assets')
    .select('*', { count: 'exact' })
    .order('downloads', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (category) builder = builder.eq('category', category);
  if (type)     builder = builder.eq('type', type);

  const { data, error, count } = await builder;

  if (error) {
    console.error('[getTrendingAssets] Error:', error.message);
    return { results: [], total: 0 };
  }

  return { results: data || [], total: count || 0 };
}
