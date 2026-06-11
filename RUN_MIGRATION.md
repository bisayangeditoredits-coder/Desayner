# ⚠️ CRITICAL: Run Views Tracking Database Migration

Views tracking is only **half-working** because the database migration hasn't been executed yet.

## What Needs to Happen

The `views_count` column doesn't exist in your Supabase database yet. You need to run the migration SQL.

## Steps to Fix (5 minutes)

### 1. Open Supabase Dashboard
Go to: https://app.supabase.com/

### 2. Navigate to SQL Editor
- Click your project
- Go to **SQL Editor** (left sidebar)
- Click **+ New Query**

### 3. Copy & Paste Migration
Copy the ENTIRE content from: `views_tracking_migration.sql`

```bash
# In PowerShell, this will copy it to clipboard:
Get-Content views_tracking_migration.sql | Set-Clipboard
```

Or just open the file in VS Code and copy it manually.

### 4. Run the Query
- Paste into Supabase SQL Editor
- Click **Run** (blue button)
- Wait for success message

### 5. Verify It Worked
Run this query to check:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' AND column_name = 'views_count';
```

Should return: `views_count | integer`

## What the Migration Does

✅ Adds `views_count INTEGER DEFAULT 0` to projects table  
✅ Adds `views_count INTEGER DEFAULT 0` to inspirations table  
✅ Adds performance indexes for sorting by views  
✅ Creates atomic RPC function for thread-safe increments  
✅ Prevents negative view counts with CHECK constraint  

## After Running Migration

Views will immediately:
- Show on all existing projects ✅
- Track new clicks correctly ✅
- Persist on page refresh ✅
- Display in real-time ✅

---

**Need Help?**
If the migration fails, check that:
1. You're using the correct Supabase project
2. You have admin/creator role in Supabase
3. The SQL syntax looks correct (no extra spaces at start)
