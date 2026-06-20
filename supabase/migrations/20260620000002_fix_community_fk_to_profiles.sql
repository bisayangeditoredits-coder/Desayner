-- ============================================================
-- Fix community tables: re-point user_id FKs to public.profiles
-- so PostgREST can resolve profiles(...) joins in API selects.
--
-- In Supabase, profiles.id = auth.users.id, so this is safe.
-- Cascade behaviour is unchanged: deleting a profile (which
-- happens when auth.users is deleted) cascades to all community rows.
-- ============================================================

-- ── community_posts ───────────────────────────────────────────────────────────

ALTER TABLE public.community_posts
  DROP CONSTRAINT IF EXISTS community_posts_user_id_fkey;

ALTER TABLE public.community_posts
  ADD CONSTRAINT community_posts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ── community_post_votes ──────────────────────────────────────────────────────

ALTER TABLE public.community_post_votes
  DROP CONSTRAINT IF EXISTS community_post_votes_user_id_fkey;

ALTER TABLE public.community_post_votes
  ADD CONSTRAINT community_post_votes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ── community_post_comments ───────────────────────────────────────────────────

ALTER TABLE public.community_post_comments
  DROP CONSTRAINT IF EXISTS community_post_comments_user_id_fkey;

ALTER TABLE public.community_post_comments
  ADD CONSTRAINT community_post_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ── community_post_reports ────────────────────────────────────────────────────

ALTER TABLE public.community_post_reports
  DROP CONSTRAINT IF EXISTS community_post_reports_user_id_fkey;

ALTER TABLE public.community_post_reports
  ADD CONSTRAINT community_post_reports_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
