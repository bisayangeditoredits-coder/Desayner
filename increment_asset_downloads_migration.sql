-- Atomic asset download counter (run once in Supabase SQL Editor)
-- Mirrors increment_project_view used by /api/view

CREATE OR REPLACE FUNCTION increment_asset_downloads(p_asset_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE assets
  SET downloads_count = COALESCE(downloads_count, 0) + 1
  WHERE id = p_asset_id
  RETURNING downloads_count INTO new_count;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Asset not found';
  END IF;

  RETURN new_count;
END;
$$;

-- Allow authenticated users to call via anon client after sign-in
GRANT EXECUTE ON FUNCTION increment_asset_downloads(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_asset_downloads(UUID) TO service_role;
