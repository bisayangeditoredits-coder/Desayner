# ⚠️ CRITICAL: Run Likes Tracking Database Migration

The reason your "Likes" are not showing up in production is because we need to tell Supabase to automatically update the `likes_count` on a project whenever someone clicks the heart button. Without this, the `likes_count` stays at `0` globally.

## Steps to Fix (2 minutes)

### 1. Open Supabase Dashboard
Go to: https://app.supabase.com/

### 2. Navigate to SQL Editor
- Click your project
- Go to **SQL Editor** (left sidebar)
- Click **+ New Query**

### 3. Copy & Paste Migration
Copy the ENTIRE SQL block below:

```sql
-- 1. Function to safely increment likes_count
CREATE OR REPLACE FUNCTION increment_project_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects 
  SET likes_count = likes_count + 1 
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to safely decrement likes_count
CREATE OR REPLACE FUNCTION decrement_project_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects 
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = OLD.project_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop existing triggers if they exist to avoid duplicates
DROP TRIGGER IF EXISTS on_project_like_insert ON project_likes;
DROP TRIGGER IF EXISTS on_project_like_delete ON project_likes;

-- 4. Create trigger for when someone likes a project
CREATE TRIGGER on_project_like_insert
AFTER INSERT ON project_likes
FOR EACH ROW EXECUTE FUNCTION increment_project_likes();

-- 5. Create trigger for when someone unlikes a project
CREATE TRIGGER on_project_like_delete
AFTER DELETE ON project_likes
FOR EACH ROW EXECUTE FUNCTION decrement_project_likes();

-- OPTIONAL: Do the same for saves_count
CREATE OR REPLACE FUNCTION increment_project_saves()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects SET saves_count = saves_count + 1 WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_project_saves()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = OLD.project_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_save_insert ON project_saves;
DROP TRIGGER IF EXISTS on_project_save_delete ON project_saves;

CREATE TRIGGER on_project_save_insert
AFTER INSERT ON project_saves
FOR EACH ROW EXECUTE FUNCTION increment_project_saves();

CREATE TRIGGER on_project_save_delete
AFTER DELETE ON project_saves
FOR EACH ROW EXECUTE FUNCTION decrement_project_saves();
```

### 4. Run the Query
- Paste into Supabase SQL Editor
- Click **Run** (blue button)
- Wait for the "Success" message

## What did we fix in the Codebase?
I have also updated your website code (`ProjectCard.jsx` and `TrendingProjectCard.jsx`) to call a new secure Serverless API (`/api/projects/[id]/like`). 
1. This securely bypasses any Row Level Security (RLS) issues you were facing in production.
2. It automatically **clears the Redis Cache** every time someone likes a post, so the feed instantly updates for everyone without having to wait 5 minutes!
