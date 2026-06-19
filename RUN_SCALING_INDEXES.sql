-- =========================================================================================
-- DESAYNER.COM — DATABASE SCALING INDEXES
-- =========================================================================================
-- Purpose: These indexes dramatically speed up database read queries when the application 
--          reaches thousands of users and projects.
-- 
-- Instructions: 
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Click "New Query"
-- 4. Paste this entire script and click "Run"
-- =========================================================================================

-- 1. PROJECTS TABLE
-- The most queried table. Needs to quickly sort by likes, filter by category/published, 
-- and find projects by a specific user.
CREATE INDEX IF NOT EXISTS idx_projects_published ON public.projects (published);
CREATE INDEX IF NOT EXISTS idx_projects_category ON public.projects (category);
CREATE INDEX IF NOT EXISTS idx_projects_likes_count ON public.projects (likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects (user_id);
-- Composite index for the exact trending feed query (published + order by likes)
CREATE INDEX IF NOT EXISTS idx_projects_published_likes ON public.projects (published, likes_count DESC);

-- 2. PROFILES TABLE
-- Profile URLs are based on usernames, so lookup speed is critical here.
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles (username);

-- 3. SOCIAL GRAPH / RELATIONSHIP TABLES
-- These tables map many-to-many relationships. 
-- Composite indexes make "Did User X like Project Y?" lookups instant.

-- Project Likes
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON public.project_likes (project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON public.project_likes (user_id);

-- Project Saves (Moodboards / Collections)
CREATE INDEX IF NOT EXISTS idx_project_saves_project_id ON public.project_saves (project_id);
CREATE INDEX IF NOT EXISTS idx_project_saves_user_id ON public.project_saves (user_id);

-- Follows
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows (following_id);

-- 4. SAVED ASSETS / PHOTOS
CREATE INDEX IF NOT EXISTS idx_saved_photos_user_id ON public.saved_photos (user_id);
CREATE INDEX IF NOT EXISTS idx_saved_photos_photo_id ON public.saved_photos (photo_id);
CREATE INDEX IF NOT EXISTS idx_asset_saves_user_id ON public.asset_saves (user_id);

-- 5. JOBS
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs (user_id);

-- 6. ASSETS
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets (category);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets (created_at DESC);

-- Note: Postgres automatically creates indexes on Primary Keys (id columns).
-- We only need to create indexes for Foreign Keys and frequently filtered/sorted columns.
