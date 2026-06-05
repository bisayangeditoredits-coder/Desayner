-- ============================================
-- CRELDESK STUDIO — COLLECTIONS MIGRATION
-- ============================================

-- 1. Create collections table
create table collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- 2. Create collection_items table
create table collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references collections(id) on delete cascade not null,
  project_id uuid references projects(id) on delete cascade not null,
  added_at timestamptz default now(),
  unique(collection_id, project_id)
);

-- 3. RLS
alter table collections enable row level security;
alter table collection_items enable row level security;

create policy "Users can manage their own collections" 
on collections for all using (auth.uid() = user_id);

create policy "Users can manage items in their collections" 
on collection_items for all using (
  auth.uid() in (select user_id from collections where id = collection_id)
);
