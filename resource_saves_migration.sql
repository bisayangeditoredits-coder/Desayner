-- ============================================
-- DRAFTLY — RESOURCE SAVES MIGRATION
-- ============================================

-- 1. Create resource_saves table
create table resource_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  resource_id uuid references resources(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, resource_id)
);

-- 2. RLS
alter table resource_saves enable row level security;

create policy "Users can view their own resource saves" 
on resource_saves for select using (auth.uid() = user_id);

create policy "Users can insert their own resource saves" 
on resource_saves for insert with check (auth.uid() = user_id);

create policy "Users can delete their own resource saves" 
on resource_saves for delete using (auth.uid() = user_id);
