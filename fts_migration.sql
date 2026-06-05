-- ===========================================
-- DRAFTLY — FULL-TEXT SEARCH MIGRATION
-- ===========================================

-- 1. Add a generated tsvector column for fast searching
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS fts tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
) STORED;

-- 2. Create an index on the new FTS column for millisecond queries
CREATE INDEX IF NOT EXISTS projects_fts_idx ON projects USING GIN (fts);
