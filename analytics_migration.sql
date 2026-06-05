-- ============================================
-- CRELDESK STUDIO — ANALYTICS MIGRATION
-- ============================================

-- 1. Add views_count to projects table
alter table projects add column if not exists views_count integer default 0;

-- 2. Create RPC to increment view count securely
create or replace function increment_project_view(p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update projects
  set views_count = views_count + 1
  where id = p_id;
end;
$$;
