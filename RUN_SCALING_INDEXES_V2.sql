-- ========================================================================================
-- DESAYNER.COM — PHASE 2 SCALING INDEXES (Run after RUN_SCALING_INDEXES.sql)
-- ========================================================================================
-- Purpose: Composite + partial indexes that match the exact query patterns in the app.
--          These dramatically speed up the home feed, category filters, and trending
--          sort at scale. Single-column indexes (from RUN_SCALING_INDEXES.sql) are a
--          prerequisite — run that file first if you haven't already.
--
-- Instructions:
--   1. Go to Supabase Dashboard → SQL Editor → New Query
--   2. Paste this entire script and click "Run"
--   3. These use CONCURRENTLY semantics on Supabase — zero downtime
-- ========================================================================================

-- ── PROJECTS TABLE ───────────────────────────────────────────────────────────────────────

-- Hot path: home feed "newest" sort (published + created_at DESC)
-- Partial index — only indexes live/published rows, making it much smaller & faster.
CREATE INDEX IF NOT EXISTS idx_projects_pub_created
  ON public.projects (created_at DESC)
  WHERE published = true;

-- Hot path: trending sort (published + trending_score DESC)
-- Matches: .eq('published', true).order('trending_score', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_projects_pub_trending
  ON public.projects (trending_score DESC NULLS LAST)
  WHERE published = true;

-- Hot path: likes-based "popular" sort
CREATE INDEX IF NOT EXISTS idx_projects_pub_likes
  ON public.projects (likes_count DESC NULLS LAST)
  WHERE published = true;

-- Hot path: category filter + newest (used by every category pill click)
-- Matches: .eq('category', cat).eq('published', true).order('created_at', { ascending: false })
CREATE INDEX IF NOT EXISTS idx_projects_category_pub_created
  ON public.projects (category, created_at DESC)
  WHERE published = true;

-- Hot path: category filter + trending
CREATE INDEX IF NOT EXISTS idx_projects_category_pub_trending
  ON public.projects (category, trending_score DESC NULLS LAST)
  WHERE published = true;

-- Hot path: category filter + popular
CREATE INDEX IF NOT EXISTS idx_projects_category_pub_likes
  ON public.projects (category, likes_count DESC NULLS LAST)
  WHERE published = true;

-- ── PROFILES TABLE ───────────────────────────────────────────────────────────────────────

-- Designers feed "followers" sort (most common sort order)
-- Partial index: only profiles with a username (unregistered incomplete profiles excluded)
CREATE INDEX IF NOT EXISTS idx_profiles_username_proj_followers
  ON public.profiles (projects_count DESC NULLS LAST, followers_count DESC NULLS LAST)
  WHERE username IS NOT NULL;

-- Designers feed "newest" sort (recently joined designers)
CREATE INDEX IF NOT EXISTS idx_profiles_username_created
  ON public.profiles (created_at DESC)
  WHERE username IS NOT NULL;

-- ── TRENDING SCORE UPDATE ─────────────────────────────────────────────────────────────────
-- Run this to backfill trending_score for existing projects.
-- After that, set up a Vercel Cron at /api/cron/update-trending to run this every 30 min.
-- ========================================================================================
UPDATE public.projects
SET trending_score = (
  COALESCE(likes_count, 0) * 1.0
  + COALESCE(saves_count, 0) * 2.0
  + COALESCE(views_count, 0) * 0.1
) / GREATEST(1.0, EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600.0)
WHERE published = true
  AND created_at > NOW() - INTERVAL '30 days';

-- Set trending_score to 0 for older published projects (they fall off trending naturally)
UPDATE public.projects
SET trending_score = 0
WHERE published = true
  AND created_at <= NOW() - INTERVAL '30 days'
  AND trending_score IS NULL;

-- ── VERIFICATION ─────────────────────────────────────────────────────────────────────────
-- After running, verify indexes were created:
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE tablename IN ('projects', 'profiles')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
