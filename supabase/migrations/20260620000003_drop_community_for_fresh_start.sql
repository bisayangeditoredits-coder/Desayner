-- ============================================================
-- Drop all community tables and start fresh.
-- Safe to run because the community feature has no production data yet.
-- After running this, re-run 20260620000000_create_community_posts.sql
-- ============================================================

-- Drop in reverse dependency order (child tables first)
DROP TABLE IF EXISTS public.community_post_reports  CASCADE;
DROP TABLE IF EXISTS public.community_post_votes    CASCADE;
DROP TABLE IF EXISTS public.community_post_comments CASCADE;
DROP TABLE IF EXISTS public.community_posts         CASCADE;

-- Drop trigger functions if they exist
DROP FUNCTION IF EXISTS sync_community_post_votes_count()     CASCADE;
DROP FUNCTION IF EXISTS sync_community_post_comments_count()  CASCADE;
DROP FUNCTION IF EXISTS update_community_post_trending_score() CASCADE;
DROP FUNCTION IF EXISTS touch_community_post_updated_at()     CASCADE;
