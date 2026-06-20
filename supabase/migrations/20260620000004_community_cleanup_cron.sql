-- ============================================================
-- Community Posts — Weekly Cleanup Cron Job
-- Uses pg_cron (already enabled for trending score job).
--
-- Runs every Sunday at 03:00 UTC (low-traffic window).
--
-- Rule 1 — Soft-deleted posts:
--   Hard-delete posts where the author chose to delete (deleted_at IS NOT NULL)
--   AND the post has been soft-deleted for more than 30 days.
--   Comments and votes cascade automatically via FK.
--
-- Rule 2 — Zero-engagement zombie posts:
--   Hard-delete posts with NO votes AND NO comments that are older than 90 days.
--   These were never interacted with — they have no community value.
--
-- NEVER deleted: any post with votes_count > 0 OR comments_count > 0,
--   regardless of age. Engaged content is kept forever.
-- ============================================================

-- Remove existing job if re-running this migration
SELECT cron.unschedule('community-cleanup-job')
FROM cron.job
WHERE jobname = 'community-cleanup-job';

SELECT cron.schedule(
  'community-cleanup-job',
  '0 3 * * 0',   -- Every Sunday at 03:00 UTC
  $$
    -- Rule 1: Hard-delete posts soft-deleted by their author more than 30 days ago
    DELETE FROM public.community_posts
    WHERE deleted_at IS NOT NULL
      AND deleted_at < NOW() - INTERVAL '30 days';

    -- Rule 2: Hard-delete zero-engagement posts older than 90 days
    DELETE FROM public.community_posts
    WHERE deleted_at IS NULL
      AND votes_count    = 0
      AND comments_count = 0
      AND created_at < NOW() - INTERVAL '90 days';
  $$
);

-- Verify the job is scheduled (should return 1 row)
SELECT jobid, jobname, schedule, command
FROM cron.job
WHERE jobname = 'community-cleanup-job';
