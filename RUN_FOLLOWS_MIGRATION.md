# ⚠️ CRITICAL: Run Follows Tracking Database Migration

Ang rason kung bakit hindi gumagana ang "Follow" button sa live production ay katulad din nung sa "Likes". Naba-block ng security ng database ang pag-follow, at hindi rin automatic na nagpa-plus one (+1) yung `followers_count` ng tao.

In-update ko na ang code natin para mag-bypass sa security using Serverless Admin API. Ang kailangan mo na lang gawin ngayon ay i-run itong SQL Trigger sa Supabase para mag-automatic update yung number ng followers at following!

## Steps to Fix (1 minute)

### 1. Open Supabase Dashboard
Go to: https://app.supabase.com/

### 2. Navigate to SQL Editor
- Click your project
- Go to **SQL Editor** (left sidebar)
- Click **+ New Query**

### 3. Copy & Paste Migration
Copy the ENTIRE SQL block below:

```sql
-- 1. Function to safely increment followers and following counts
CREATE OR REPLACE FUNCTION increment_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment following count for the user who followed
  UPDATE profiles 
  SET following_count = following_count + 1 
  WHERE id = NEW.follower_id;

  -- Increment followers count for the user being followed
  UPDATE profiles 
  SET followers_count = followers_count + 1 
  WHERE id = NEW.following_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to safely decrement followers and following counts
CREATE OR REPLACE FUNCTION decrement_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement following count for the user who unfollowed
  UPDATE profiles 
  SET following_count = GREATEST(following_count - 1, 0)
  WHERE id = OLD.follower_id;

  -- Decrement followers count for the user who was unfollowed
  UPDATE profiles 
  SET followers_count = GREATEST(followers_count - 1, 0)
  WHERE id = OLD.following_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop existing triggers if they exist to avoid duplicates
DROP TRIGGER IF EXISTS on_follow_insert ON follows;
DROP TRIGGER IF EXISTS on_follow_delete ON follows;

-- 4. Create trigger for when someone follows
CREATE TRIGGER on_follow_insert
AFTER INSERT ON follows
FOR EACH ROW EXECUTE FUNCTION increment_follow_counts();

-- 5. Create trigger for when someone unfollows
CREATE TRIGGER on_follow_delete
AFTER DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION decrement_follow_counts();
```

### 4. Run the Query
- Paste into Supabase SQL Editor
- Click **Run** (blue button)
- Wait for the "Success" message

Yung website code mo (API) ay na-update ko na din! Pagkatapos mong i-run ito sa Supabase, automatic nang gagana ang Follow button at mag-u-update ang follower counts nang walang errors sa buong website ninyo!
