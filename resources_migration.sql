-- ============================================
-- DRAFTLY — RESOURCES MIGRATION
-- ============================================

-- 1. Create resources table
create table resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  link text not null,
  thumbnail_url text,
  category text,
  created_at timestamptz default now()
);

-- 2. RLS
alter table resources enable row level security;

create policy "Resources are viewable by everyone" 
on resources for select using (true);

create policy "Users can insert their own resources" 
on resources for insert with check (auth.uid() = user_id);

create policy "Users can update their own resources" 
on resources for update using (auth.uid() = user_id);

create policy "Users can delete their own resources" 
on resources for delete using (auth.uid() = user_id);
