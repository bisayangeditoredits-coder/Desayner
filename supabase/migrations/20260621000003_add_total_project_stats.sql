-- 1. Add aggregated columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_project_likes INT DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_project_views INT DEFAULT 0;

-- 2. Trigger function for UPDATE
CREATE OR REPLACE FUNCTION update_profile_project_stats_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.likes_count IS DISTINCT FROM NEW.likes_count) OR (OLD.views_count IS DISTINCT FROM NEW.views_count) THEN
    UPDATE public.profiles
    SET 
      total_project_likes = total_project_likes + (NEW.likes_count - OLD.likes_count),
      total_project_views = total_project_views + (NEW.views_count - OLD.views_count)
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_stats_update ON public.projects;
CREATE TRIGGER trigger_update_profile_stats_update
AFTER UPDATE OF likes_count, views_count
ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_profile_project_stats_update();

-- 3. Trigger function for INSERT
CREATE OR REPLACE FUNCTION update_profile_project_stats_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.likes_count > 0 OR NEW.views_count > 0 THEN
    UPDATE public.profiles
    SET 
      total_project_likes = total_project_likes + NEW.likes_count,
      total_project_views = total_project_views + NEW.views_count
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_stats_insert ON public.projects;
CREATE TRIGGER trigger_update_profile_stats_insert
AFTER INSERT
ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_profile_project_stats_insert();

-- 4. Trigger function for DELETE
CREATE OR REPLACE FUNCTION update_profile_project_stats_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    total_project_likes = total_project_likes - OLD.likes_count,
    total_project_views = total_project_views - OLD.views_count
  WHERE id = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_stats_delete ON public.projects;
CREATE TRIGGER trigger_update_profile_stats_delete
AFTER DELETE
ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_profile_project_stats_delete();

-- 5. Backfill existing data
WITH aggregated AS (
  SELECT user_id, SUM(likes_count) as sum_likes, SUM(views_count) as sum_views
  FROM public.projects
  GROUP BY user_id
)
UPDATE public.profiles p
SET 
  total_project_likes = COALESCE(a.sum_likes, 0),
  total_project_views = COALESCE(a.sum_views, 0)
FROM aggregated a
WHERE p.id = a.user_id;
