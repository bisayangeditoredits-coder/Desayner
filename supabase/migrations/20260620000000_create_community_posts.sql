-- ============================================================
-- Community Posts  (idempotent — safe to re-run)
-- Reddit-style forum for Desayner: posts, upvotes, comments.
--
-- Design decisions:
--   - Denormalized counters (votes_count, comments_count) kept
--     accurate by Postgres triggers (see next migration).
--   - votes_count is COUNT of rows; upvote-only (no negative values).
--   - flair is a fixed enum of 4 values.
--   - Soft-delete (deleted_at) on posts and comments preserves
--     thread structure without breaking comment counts.
--   - Partial indexes on deleted_at IS NULL keep queries fast
--     as the table grows; no full-table scans for the feed.
-- ============================================================

-- ── Posts ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_posts (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT        NOT NULL CHECK (char_length(title) BETWEEN 3 AND 300),
  body           TEXT,
  link_url       TEXT,
  image_url      TEXT,
  flair          TEXT        NOT NULL DEFAULT 'general'
                               CHECK (flair IN ('general', 'question', 'help', 'feedback')),
  votes_count    INT         NOT NULL DEFAULT 0,
  comments_count INT         NOT NULL DEFAULT 0,
  trending_score FLOAT8      NOT NULL DEFAULT 0,
  is_pinned      BOOLEAN     NOT NULL DEFAULT FALSE,
  deleted_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patch any missing columns if the table already existed with an old schema
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS body           TEXT;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS link_url       TEXT;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS image_url      TEXT;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS flair          TEXT NOT NULL DEFAULT 'general';
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS votes_count    INT  NOT NULL DEFAULT 0;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS comments_count INT  NOT NULL DEFAULT 0;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS trending_score FLOAT8 NOT NULL DEFAULT 0;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS is_pinned      BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS deleted_at     TIMESTAMPTZ;
ALTER TABLE public.community_posts ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ── Upvotes ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_post_votes (
  post_id    UUID        NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- ── Comments ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    UUID        NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id  UUID        REFERENCES public.community_post_comments(id) ON DELETE SET NULL,
  body       TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Patch missing columns
ALTER TABLE public.community_post_comments ADD COLUMN IF NOT EXISTS parent_id  UUID REFERENCES public.community_post_comments(id) ON DELETE SET NULL;
ALTER TABLE public.community_post_comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ── Reports ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.community_post_reports (
  post_id    UUID        NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason     TEXT        CHECK (reason IN ('spam', 'harassment', 'misinformation', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- Patch missing columns
ALTER TABLE public.community_post_reports ADD COLUMN IF NOT EXISTS reason TEXT;


-- ── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.community_posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_votes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_post_reports  ENABLE ROW LEVEL SECURITY;

-- Drop policies before re-creating so re-runs don't error
DROP POLICY IF EXISTS "community_posts_public_read"    ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_auth_insert"    ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_author_update"  ON public.community_posts;
DROP POLICY IF EXISTS "community_votes_public_read"    ON public.community_post_votes;
DROP POLICY IF EXISTS "community_votes_auth_insert"    ON public.community_post_votes;
DROP POLICY IF EXISTS "community_votes_auth_delete"    ON public.community_post_votes;
DROP POLICY IF EXISTS "community_comments_public_read" ON public.community_post_comments;
DROP POLICY IF EXISTS "community_comments_auth_insert" ON public.community_post_comments;
DROP POLICY IF EXISTS "community_comments_author_update" ON public.community_post_comments;
DROP POLICY IF EXISTS "community_reports_auth_insert"  ON public.community_post_reports;
DROP POLICY IF EXISTS "community_reports_own_read"     ON public.community_post_reports;

-- Posts: public read of non-deleted rows
CREATE POLICY "community_posts_public_read"
  ON public.community_posts FOR SELECT
  USING (deleted_at IS NULL);

-- Posts: auth insert
CREATE POLICY "community_posts_auth_insert"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Posts: author can soft-delete / edit own posts
CREATE POLICY "community_posts_author_update"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Votes: public read
CREATE POLICY "community_votes_public_read"
  ON public.community_post_votes FOR SELECT
  USING (true);

-- Votes: auth insert
CREATE POLICY "community_votes_auth_insert"
  ON public.community_post_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Votes: auth delete own
CREATE POLICY "community_votes_auth_delete"
  ON public.community_post_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Comments: public read of non-deleted
CREATE POLICY "community_comments_public_read"
  ON public.community_post_comments FOR SELECT
  USING (deleted_at IS NULL);

-- Comments: auth insert
CREATE POLICY "community_comments_auth_insert"
  ON public.community_post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comments: author can soft-delete
CREATE POLICY "community_comments_author_update"
  ON public.community_post_comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Reports: auth insert
CREATE POLICY "community_reports_auth_insert"
  ON public.community_post_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Reports: own read
CREATE POLICY "community_reports_own_read"
  ON public.community_post_reports FOR SELECT
  USING (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_community_posts_hot
  ON public.community_posts(trending_score DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_community_posts_newest
  ON public.community_posts(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_community_posts_top
  ON public.community_posts(votes_count DESC, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_community_posts_flair
  ON public.community_posts(flair, trending_score DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_community_posts_user
  ON public.community_posts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_comments_post
  ON public.community_post_comments(post_id, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_community_votes_post
  ON public.community_post_votes(post_id);

CREATE INDEX IF NOT EXISTS idx_community_votes_user
  ON public.community_post_votes(user_id);
