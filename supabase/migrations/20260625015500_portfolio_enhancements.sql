-- Add social links, experience, services, testimonials as JSONB to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS experience JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb;

-- Add is_featured and collection_name to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS collection_name TEXT;

-- Create index on collection_name to speed up grouping if needed in future
CREATE INDEX IF NOT EXISTS idx_projects_collection_name ON projects(collection_name);
