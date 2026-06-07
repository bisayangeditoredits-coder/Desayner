-- ============================================
-- VIEWS TRACKING MIGRATION
-- Set up robust view counting for projects and inspirations
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. PROJECTS TABLE - Ensure views_count column exists with proper setup
DO $$
BEGIN
  -- Add views_count column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE projects ADD COLUMN views_count INTEGER DEFAULT 0 NOT NULL;
  END IF;
  
  -- Set constraint to prevent negative values
  ALTER TABLE projects ADD CONSTRAINT check_projects_views_count CHECK (views_count >= 0);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Column already has constraint';
END $$;

-- 2. INSPIRATIONS TABLE - Ensure views_count column exists with proper setup
DO $$
BEGIN
  -- Add views_count column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inspirations' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE inspirations ADD COLUMN views_count INTEGER DEFAULT 0 NOT NULL;
  END IF;
  
  -- Set constraint to prevent negative values
  ALTER TABLE inspirations ADD CONSTRAINT check_inspirations_views_count CHECK (views_count >= 0);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Column already has constraint';
END $$;

-- 3. CREATE INDEXES for performance at scale
-- Index for sorting by views (popular items first)
CREATE INDEX IF NOT EXISTS idx_projects_views_count 
ON projects(views_count DESC);

CREATE INDEX IF NOT EXISTS idx_inspirations_views_count 
ON inspirations(views_count DESC);

-- 4. CREATE RPC FUNCTION for atomic increment (safe for concurrent users)
CREATE OR REPLACE FUNCTION increment_project_view(p_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE projects
  SET views_count = views_count + 1
  WHERE id = p_id
  RETURNING views_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Create similar function for inspirations
CREATE OR REPLACE FUNCTION increment_inspiration_view(i_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE inspirations
  SET views_count = views_count + 1
  WHERE id = i_id
  RETURNING views_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$ LANGUAGE plpgsql;

-- 5. GRANT permissions (for RLS compatibility)
GRANT EXECUTE ON FUNCTION increment_project_view TO authenticated, anon;
GRANT EXECUTE ON FUNCTION increment_inspiration_view TO authenticated, anon;

-- 6. CREATE MATERIALIZED VIEW for trending items (cache for performance)
-- This can be refreshed periodically to get trending content
CREATE MATERIALIZED VIEW IF NOT EXISTS trending_projects AS
SELECT 
  id,
  title,
  views_count,
  likes_count,
  created_at,
  (views_count::FLOAT / GREATEST(1, EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)) AS views_per_day
FROM projects
ORDER BY views_count DESC
LIMIT 100;

CREATE MATERIALIZED VIEW IF NOT EXISTS trending_inspirations AS
SELECT 
  id,
  title,
  views_count,
  likes_count,
  created_at,
  (views_count::FLOAT / GREATEST(1, EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400)) AS views_per_day
FROM inspirations
ORDER BY views_count DESC
LIMIT 100;

-- 7. Log view tracking for analytics (optional - helps with debugging)
CREATE TABLE IF NOT EXISTS view_analytics_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL, -- 'project' or 'inspiration'
  item_id UUID NOT NULL,
  tracked_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address TEXT
);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_view_analytics_item_id 
ON view_analytics_log(item_id, tracked_at DESC);

CREATE INDEX IF NOT EXISTS idx_view_analytics_user_id 
ON view_analytics_log(user_id, tracked_at DESC);

-- ============================================
-- SUMMARY
-- ============================================
-- ✓ Added views_count columns with NOT NULL defaults
-- ✓ Added CHECK constraints to prevent negative counts
-- ✓ Created indexes for querying popular items
-- ✓ Created RPC functions for atomic increments (thread-safe)
-- ✓ Created trending views for quick analytics
-- ✓ Created analytics log for detailed tracking
-- 
-- SAFE FOR SCALE: This setup handles concurrent requests
-- with atomic database operations
-- ============================================
