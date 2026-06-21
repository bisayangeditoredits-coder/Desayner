-- Drop all community tables completely
-- Run this in Supabase Dashboard → SQL Editor → New Query

-- Drop triggers first (if any remain)
DROP TRIGGER IF EXISTS update_community_post_comments_count ON public.community_post_comments;
DROP TRIGGER IF EXISTS update_community_post_votes_count ON public.community_post_votes;
DROP TRIGGER IF EXISTS trg_community_post_comment_count ON public.community_post_comments;
DROP TRIGGER IF EXISTS trg_community_post_vote_count ON public.community_post_votes;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_community_post_comment_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_community_post_vote_count() CASCADE;

-- Drop tables (CASCADE handles FK dependencies)
DROP TABLE IF EXISTS public.community_post_reports  CASCADE;
DROP TABLE IF EXISTS public.community_post_votes    CASCADE;
DROP TABLE IF EXISTS public.community_post_comments CASCADE;
DROP TABLE IF EXISTS public.community_posts         CASCADE;

-- Drop the post_reactions table (unused dead code cleaned up earlier)
DROP TABLE IF EXISTS public.post_reactions CASCADE;
