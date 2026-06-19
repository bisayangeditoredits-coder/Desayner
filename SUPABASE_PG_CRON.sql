-- ── PG_CRON SETUP FOR TRENDING SCORE ──────────────────────────────────────────
-- Run this in your Supabase SQL Editor.
-- This native cron runs entirely inside your database, replacing the Vercel cron
-- which failed because Vercel Hobby accounts only allow daily cron jobs.

-- 1. Enable the pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule the job to run every 30 minutes
-- It calls the 'update_trending_scores' RPC function you created earlier.
SELECT cron.schedule(
  'update-trending-scores-job', 
  '*/30 * * * *', 
  $$ SELECT update_trending_scores(); $$
);

-- Note: To see scheduled jobs:
-- SELECT * FROM cron.job;
--
-- To unschedule/delete later if needed:
-- SELECT cron.unschedule('update-trending-scores-job');
