# Asset Download Counter Migration

Run this once in the **Supabase SQL Editor** so `/api/assets` PATCH uses an atomic counter.

## Steps

1. Open [Supabase Dashboard](https://app.supabase.com/) → your project → **SQL Editor**
2. Paste the full contents of `increment_asset_downloads_migration.sql`
3. Click **Run**

## Verify

```sql
SELECT proname FROM pg_proc WHERE proname = 'increment_asset_downloads';
```

Should return one row.

## What it does

- Creates `increment_asset_downloads(uuid)` — thread-safe `downloads_count + 1`
- Grants execute to `authenticated` and `service_role`
