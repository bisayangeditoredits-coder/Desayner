-- 1. Add the column with a default of 0
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS trending_score float8 DEFAULT 0;

-- 2. Create the immutable scoring function (Reddit hot ranking algorithm)
CREATE OR REPLACE FUNCTION calculate_trending_score()
RETURNS TRIGGER AS $$
DECLARE
  popularity_score float8;
  time_factor float8;
BEGIN
  -- We weight likes (10x), saves (15x), and views (1x)
  popularity_score := (NEW.likes_count * 10.0) + (NEW.saves_count * 15.0) + (NEW.views_count * 1.0);
  
  -- Time factor: Reddit uses epoch / 45000 (~12.5 hours). We'll use the same for good decay.
  time_factor := EXTRACT(EPOCH FROM NEW.created_at) / 45000.0;
  
  -- Prevent log(0) and negative scores
  IF popularity_score < 1 THEN
    popularity_score := 1;
  END IF;
  
  -- Score calculation
  NEW.trending_score := log(10.0, popularity_score::numeric)::float8 + time_factor;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the trigger to auto-update the score
DROP TRIGGER IF EXISTS trigger_update_trending_score ON public.projects;
CREATE TRIGGER trigger_update_trending_score
BEFORE INSERT OR UPDATE OF likes_count, saves_count, views_count
ON public.projects
FOR EACH ROW
EXECUTE FUNCTION calculate_trending_score();

-- 4. Backfill existing projects using an UPDATE statement to trigger the function
UPDATE public.projects SET likes_count = likes_count;

-- 5. Create an index for instant sorting and pagination
CREATE INDEX IF NOT EXISTS idx_projects_trending ON public.projects(category, trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_projects_trending_all ON public.projects(trending_score DESC);
