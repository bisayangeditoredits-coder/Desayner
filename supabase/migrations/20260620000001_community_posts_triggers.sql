-- ============================================================
-- Community Posts — Postgres Triggers
-- Keeps denormalized counters and trending_score accurate
-- without extra API round-trips.
--
-- All functions are SECURITY DEFINER-free — they run as the
-- table owner, which is fine for trigger context.
-- ============================================================

-- ── 1. votes_count ───────────────────────────────────────────────────────────
-- Called AFTER INSERT OR DELETE on community_post_votes.
-- Upvote-only: votes_count = COUNT(*) of rows for that post.

CREATE OR REPLACE FUNCTION sync_community_post_votes_count()
RETURNS TRIGGER AS $$
DECLARE
  target_post_id UUID;
BEGIN
  target_post_id := COALESCE(NEW.post_id, OLD.post_id);
  UPDATE public.community_posts
  SET votes_count = (
    SELECT COUNT(*)
    FROM public.community_post_votes
    WHERE post_id = target_post_id
  )
  WHERE id = target_post_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_community_votes ON public.community_post_votes;
CREATE TRIGGER trigger_sync_community_votes
AFTER INSERT OR DELETE ON public.community_post_votes
FOR EACH ROW EXECUTE FUNCTION sync_community_post_votes_count();

-- ── 2. comments_count ────────────────────────────────────────────────────────
-- Called AFTER INSERT OR UPDATE on community_post_comments.
-- Only counts non-deleted comments.

CREATE OR REPLACE FUNCTION sync_community_post_comments_count()
RETURNS TRIGGER AS $$
DECLARE
  target_post_id UUID;
BEGIN
  target_post_id := COALESCE(NEW.post_id, OLD.post_id);
  UPDATE public.community_posts
  SET comments_count = (
    SELECT COUNT(*)
    FROM public.community_post_comments
    WHERE post_id = target_post_id
      AND deleted_at IS NULL
  )
  WHERE id = target_post_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_community_comments ON public.community_post_comments;
CREATE TRIGGER trigger_sync_community_comments
AFTER INSERT OR UPDATE OF deleted_at ON public.community_post_comments
FOR EACH ROW EXECUTE FUNCTION sync_community_post_comments_count();

-- ── 3. trending_score ────────────────────────────────────────────────────────
-- Same Reddit hot-ranking algorithm already used for projects.
-- Called BEFORE UPDATE OF votes_count on community_posts.
-- Formula: log10(max(votes, 1)) + epoch(created_at) / 45000

CREATE OR REPLACE FUNCTION update_community_post_trending_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.trending_score := log(10.0, GREATEST(NEW.votes_count, 1)::numeric)::FLOAT8
    + EXTRACT(EPOCH FROM NEW.created_at) / 45000.0;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_community_post_trending ON public.community_posts;
CREATE TRIGGER trigger_community_post_trending
BEFORE UPDATE OF votes_count ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION update_community_post_trending_score();

-- ── 4. updated_at auto-stamp ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_community_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_community_post_updated_at ON public.community_posts;
CREATE TRIGGER trigger_community_post_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW EXECUTE FUNCTION touch_community_post_updated_at();
