-- Add external link support to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS external_link text;
