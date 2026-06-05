-- ============================================================
-- Migration: Add thumbnail_url column to projects table
-- Purpose:   Store a separate small-dimension (≤500px wide) WebP
--            thumbnail generated client-side before upload.
--            This thumbnail is served in project cards and feeds
--            instead of the full cover_url, dramatically reducing
--            bandwidth and improving load times.
-- Run in:    Supabase SQL Editor → New Query → Run
-- ============================================================

-- 1. Add thumbnail_url column (nullable, no default needed —
--    existing rows will just show cover_url as fallback)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- 2. Add a comment for documentation
COMMENT ON COLUMN public.projects.thumbnail_url IS
  'Small WebP thumbnail (≤500px wide, ~75% quality) generated client-side.
   Used in project cards and feeds. Falls back to cover_url if null.
   Full-resolution image is stored in cover_url.';

-- 3. Index — most feed/card queries filter by published=true and
--    order by created_at/likes_count. The thumbnail URL itself
--    does not need its own index, but confirm these exist:
CREATE INDEX IF NOT EXISTS idx_projects_published_created
  ON public.projects (published, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_projects_published_likes
  ON public.projects (published, likes_count DESC);

-- 4. Verify (optional — inspect result)
-- SELECT id, title, cover_url, thumbnail_url
-- FROM public.projects
-- LIMIT 5;
