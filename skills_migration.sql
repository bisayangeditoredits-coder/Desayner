-- Profile skills for discovery + portfolio nudge email tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}'::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS portfolio_nudge_sent_at timestamptz;

COMMENT ON COLUMN public.profiles.skills IS
  'Design skills/tags (e.g. UI Design, Branding) shown on designer cards before projects exist.';

COMMENT ON COLUMN public.profiles.portfolio_nudge_sent_at IS
  'When the day-3 portfolio completion email was sent (null = not sent yet).';
