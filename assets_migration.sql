-- ============================================
-- CRELDESK STUDIO — ASSET STORE MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create assets table
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  thumbnail_url text,
  preview_url text,
  link text,
  file_url text,
  price text default 'Free',
  category text check (category in ('Figma', 'Framer', 'Webflow', 'UI Kit', 'Icon Pack', 'Font', 'Mockup', 'Other')) not null,
  downloads_count int default 0,
  saves_count int default 0,
  created_at timestamptz default now()
);

-- 2. Create asset saves table
create table if not exists asset_saves (
  user_id uuid references profiles(id) on delete cascade not null,
  asset_id uuid references assets(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (user_id, asset_id)
);

-- 3. Enable Row Level Security (RLS)
alter table assets enable row level security;
alter table asset_saves enable row level security;

-- 4. Set up RLS Policies
-- Assets Policies
drop policy if exists "Anyone can read assets" on assets;
create policy "Anyone can read assets" on assets
  for select using (true);

drop policy if exists "Authenticated users can insert assets" on assets;
create policy "Authenticated users can insert assets" on assets
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own assets" on assets;
create policy "Users can delete their own assets" on assets
  for delete using (auth.uid() = user_id);

-- Asset Saves Policies
drop policy if exists "Anyone can read asset saves" on asset_saves;
create policy "Anyone can read asset saves" on asset_saves
  for select using (true);

drop policy if exists "Authenticated users can save assets" on asset_saves;
create policy "Authenticated users can save assets" on asset_saves
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can unsave assets" on asset_saves;
create policy "Users can unsave assets" on asset_saves
  for delete using (auth.uid() = user_id);

-- 5. Setup automated saves count trigger
create or replace function update_asset_saves_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update assets set saves_count = saves_count + 1 where id = NEW.asset_id;
  elsif TG_OP = 'DELETE' then
    update assets set saves_count = saves_count - 1 where id = OLD.asset_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_asset_save_change on asset_saves;
create trigger on_asset_save_change
  after insert or delete on asset_saves
  for each row execute procedure update_asset_saves_count();

-- 6. Create optimized performance indexes
create index if not exists idx_assets_created_at on assets (created_at desc);
create index if not exists idx_assets_category on assets (category);
create index if not exists idx_assets_user_id on assets (user_id);
create index if not exists idx_asset_saves_lookup on asset_saves (asset_id, user_id);

-- 7. Enable Realtime updates
alter publication supabase_realtime add table assets;
alter publication supabase_realtime add table asset_saves;
