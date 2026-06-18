-- Migration: Add missing B-Tree indexes and GIN index for FTS

-- 1. Create a generated TSVECTOR column for full-text search and index it
ALTER TABLE projects ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
) STORED;

CREATE INDEX IF NOT EXISTS projects_fts_idx ON projects USING GIN (fts);

-- 2. Add B-Tree indexes for heavily sorted columns in API routes
CREATE INDEX IF NOT EXISTS idx_projects_likes_count ON projects (likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_projects_views_count ON projects (views_count DESC);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);

-- Profiles sorting
CREATE INDEX IF NOT EXISTS idx_profiles_followers_count ON profiles (followers_count DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_profiles_projects_count ON profiles (projects_count DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles (created_at DESC);

-- 3. Add Indexes for Foreign Keys to avoid sequential scans during joins/deletes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_project_id ON project_likes (project_id);
CREATE INDEX IF NOT EXISTS idx_project_likes_user_id ON project_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications (actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON notifications (project_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows (following_id);
