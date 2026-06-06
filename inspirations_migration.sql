-- ============================================
-- CRELDESK STUDIO — INSPIRATIONS MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create inspirations table
create table if not exists inspirations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  image_url text not null,
  thumbnail_url text,
  title text,
  description text,
  category text default 'General',
  likes_count int default 0,
  created_at timestamptz default now()
);

-- 2. Create inspiration likes table
create table if not exists inspiration_likes (
  user_id uuid references profiles(id) on delete cascade not null,
  inspiration_id uuid references inspirations(id) on delete cascade not null,
  created_at timestamptz default now(),
  primary key (user_id, inspiration_id)
);

-- 3. Modify notifications table to include inspiration_id
alter table notifications add column if not exists inspiration_id uuid references inspirations(id) on delete cascade;

-- 4. Enable Row Level Security (RLS)
alter table inspirations enable row level security;
alter table inspiration_likes enable row level security;

-- 5. Set up RLS Policies
-- Inspirations Policies
drop policy if exists "Anyone can read inspirations" on inspirations;
create policy "Anyone can read inspirations" on inspirations
  for select using (true);

drop policy if exists "Authenticated users can insert inspirations" on inspirations;
create policy "Authenticated users can insert inspirations" on inspirations
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own inspirations" on inspirations;
create policy "Users can delete their own inspirations" on inspirations
  for delete using (auth.uid() = user_id);

-- Inspiration Likes Policies
drop policy if exists "Anyone can read inspiration likes" on inspiration_likes;
create policy "Anyone can read inspiration likes" on inspiration_likes
  for select using (true);

drop policy if exists "Authenticated users can like inspirations" on inspiration_likes;
create policy "Authenticated users can like inspirations" on inspiration_likes
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can unlike inspirations" on inspiration_likes;
create policy "Users can unlike inspirations" on inspiration_likes
  for delete using (auth.uid() = user_id);

-- 6. Setup automated like counter trigger
create or replace function update_inspiration_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update inspirations set likes_count = likes_count + 1 where id = NEW.inspiration_id;
  elsif TG_OP = 'DELETE' then
    update inspirations set likes_count = likes_count - 1 where id = OLD.inspiration_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_inspiration_like_change on inspiration_likes;
create trigger on_inspiration_like_change
  after insert or delete on inspiration_likes
  for each row execute procedure update_inspiration_likes_count();

-- 7. Setup like notification trigger
create or replace function handle_new_inspiration_like() 
returns trigger as $$
declare
  target_user_id uuid;
begin
  select user_id into target_user_id from inspirations where id = new.inspiration_id;
  if target_user_id != new.user_id then
    insert into notifications (user_id, actor_id, type, inspiration_id)
    values (target_user_id, new.user_id, 'like', new.inspiration_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_inspiration_like_notif on inspiration_likes;
create trigger on_inspiration_like_notif
  after insert on inspiration_likes
  for each row execute procedure handle_new_inspiration_like();

-- 8. Create optimized performance indexes
create index if not exists idx_inspirations_created_at on inspirations (created_at desc);
create index if not exists idx_inspirations_category on inspirations (category);
create index if not exists idx_inspirations_user_id on inspirations (user_id);
create index if not exists idx_inspiration_likes_lookup on inspiration_likes (inspiration_id, user_id);

-- 9. Enable Realtime updates
alter publication supabase_realtime add table inspirations;
alter publication supabase_realtime add table inspiration_likes;
