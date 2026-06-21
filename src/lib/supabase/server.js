/**
 * Server-side Supabase helpers.
 *
 * Background: NEXT_PUBLIC_SUPABASE_ANON_KEY uses Supabase's new opaque
 * `sb_publishable_` format. PostgREST cannot evaluate `auth.uid()` in RLS
 * policies when DB queries run under the anon key from a Route Handler.
 *
 * Pattern for Route Handlers (API routes):
 *   1. createAnonClient(request) → auth.getUser() only
 *   2. createAdminClient() → all DB operations (bypasses RLS)
 *   3. Shorthand: getServerAuth(request) → { user, admin }
 *
 * Pattern for Server Components / pages:
 *   Use createClient() — still works for Server Component rendering context.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ─── Route Handler helpers ────────────────────────────────────────────────────

/**
 * Anon client for Route Handlers — use ONLY for auth.getUser() / auth.getSession().
 * Do NOT use for DB queries that require RLS-based auth.uid().
 * @param {import('next/server').NextRequest} request
 */
export function createAnonClient(request) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => request.cookies.getAll() } }
  );
}

/**
 * Service role client — bypasses all RLS.
 * Server-side only. NEVER expose to the client.
 * Always verify ownership in application code before mutating data.
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

/**
 * Read-replica client — routes SELECT queries to the replica for lower latency
 * and reduced load on the primary database.
 *
 * Falls back to the primary (admin) client when SUPABASE_REPLICA_URL is not set.
 *
 * Usage:
 *   const db = createReadClient();
 *   const { data } = await db.from('projects').select('*');
 *
 * IMPORTANT: Do NOT use this for writes (INSERT, UPDATE, DELETE) —
 * replicas are read-only. Use createAdminClient() for mutations.
 */
export function createReadClient() {
  const replicaUrl = process.env.SUPABASE_REPLICA_URL;
  if (!replicaUrl) {
    // No replica configured — fall back to primary
    return createAdminClient();
  }
  return createServerClient(
    replicaUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

/**
 * Verify caller identity and return { user, admin }.
 * @param {import('next/server').NextRequest} request
 * @returns {Promise<{ user: import('@supabase/supabase-js').User|null, admin: import('@supabase/supabase-js').SupabaseClient }>}
 */
export async function getServerAuth(request) {
  const anon  = createAnonClient(request);
  const { data } = await anon.auth.getUser();
  return { user: data?.user ?? null, admin: createAdminClient() };
}

// ─── Server Component helper (pages, layouts, sitemap) ───────────────────────

/**
 * Supabase client for Server Components — reads cookies via next/headers.
 * Safe to use in page.js, layout.js, sitemap.js and other RSC contexts.
 * For Route Handlers use createAnonClient(request) + createAdminClient() instead.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies set in middleware instead.
          }
        },
      },
    }
  );
}
