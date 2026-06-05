-- ============================================
-- CRELDESK STUDIO — DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  location text,
  followers_count int default 0,
  following_count int default 0,
  projects_count int default 0,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(split_part(new.email, '@', 1), 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── FOLLOWS ──────────────────────────────────────────────────────────────────
create table if not exists follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- Update follower/following counts
create or replace function update_follow_counts()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set following_count = following_count + 1 where id = NEW.follower_id;
    update profiles set followers_count = followers_count + 1 where id = NEW.following_id;
  elsif TG_OP = 'DELETE' then
    update profiles set following_count = following_count - 1 where id = OLD.follower_id;
    update profiles set followers_count = followers_count - 1 where id = OLD.following_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_follow_change on follows;
create trigger on_follow_change
  after insert or delete on follows
  for each row execute procedure update_follow_counts();

-- ─── PROJECTS ─────────────────────────────────────────────────────────────────
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  images text[] default '{}',
  tags text[] default '{}',
  category text default 'Design',
  published boolean default true,
  likes_count int default 0,
  saves_count int default 0,
  comments_count int default 0,
  views_count int default 0,
  created_at timestamptz default now()
);

create table if not exists project_likes (
  user_id uuid references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, project_id)
);

create table if not exists project_saves (
  user_id uuid references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, project_id)
);

create table if not exists project_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- Counters
create or replace function update_project_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update projects set likes_count = likes_count + 1 where id = NEW.project_id;
  elsif TG_OP = 'DELETE' then
    update projects set likes_count = likes_count - 1 where id = OLD.project_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_project_like on project_likes;
create trigger on_project_like after insert or delete on project_likes
  for each row execute procedure update_project_likes_count();

create or replace function update_project_saves_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update projects set saves_count = saves_count + 1 where id = NEW.project_id;
  elsif TG_OP = 'DELETE' then
    update projects set saves_count = saves_count - 1 where id = OLD.project_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_project_save on project_saves;
create trigger on_project_save after insert or delete on project_saves
  for each row execute procedure update_project_saves_count();

create or replace function update_project_comments_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update projects set comments_count = comments_count + 1 where id = NEW.project_id;
  elsif TG_OP = 'DELETE' then
    update projects set comments_count = comments_count - 1 where id = OLD.project_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_project_comment on project_comments;
create trigger on_project_comment after insert or delete on project_comments
  for each row execute procedure update_project_comments_count();

create or replace function update_profile_projects_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set projects_count = projects_count + 1 where id = NEW.user_id;
  elsif TG_OP = 'DELETE' then
    update profiles set projects_count = projects_count - 1 where id = OLD.user_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_project_change on projects;
create trigger on_project_change after insert or delete on projects
  for each row execute procedure update_profile_projects_count();

-- ─── COMMUNITY POSTS ──────────────────────────────────────────────────────────
create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  body text not null,
  image_url text,
  post_type text default 'share' check (post_type in ('share', 'help', 'feedback')),
  reactions_count int default 0,
  comments_count int default 0,
  saves_count int default 0,
  created_at timestamptz default now()
);

create table if not exists post_reactions (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references community_posts(id) on delete cascade,
  emoji text not null default '❤️',
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references community_posts(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists post_saves (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references community_posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table follows enable row level security;
alter table projects enable row level security;
alter table project_likes enable row level security;
alter table project_saves enable row level security;
alter table project_comments enable row level security;
alter table community_posts enable row level security;
alter table post_reactions enable row level security;
alter table post_comments enable row level security;
alter table post_saves enable row level security;

-- Profiles: public read, own write
create policy "Public profiles are viewable" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Follows: public read, auth write
create policy "Follows viewable" on follows for select using (true);
create policy "Auth can follow" on follows for insert with check (auth.uid() = follower_id);
create policy "Auth can unfollow" on follows for delete using (auth.uid() = follower_id);

-- Projects: public read, own write
create policy "Projects viewable" on projects for select using (published = true or auth.uid() = user_id);
create policy "Auth can create project" on projects for insert with check (auth.uid() = user_id);
create policy "Auth can update own project" on projects for update using (auth.uid() = user_id);
create policy "Auth can delete own project" on projects for delete using (auth.uid() = user_id);

-- Interactions: public read, auth write
create policy "Project likes viewable" on project_likes for select using (true);
create policy "Auth can like" on project_likes for insert with check (auth.uid() = user_id);
create policy "Auth can unlike" on project_likes for delete using (auth.uid() = user_id);

create policy "Project saves viewable" on project_saves for select using (true);
create policy "Auth can save project" on project_saves for insert with check (auth.uid() = user_id);
create policy "Auth can unsave project" on project_saves for delete using (auth.uid() = user_id);

create policy "Project comments viewable" on project_comments for select using (true);
create policy "Auth can comment" on project_comments for insert with check (auth.uid() = user_id);
create policy "Auth can delete own comment" on project_comments for delete using (auth.uid() = user_id);

create policy "Community posts viewable" on community_posts for select using (true);
create policy "Auth can post" on community_posts for insert with check (auth.uid() = user_id);
create policy "Auth can delete own post" on community_posts for delete using (auth.uid() = user_id);

create policy "Post reactions viewable" on post_reactions for select using (true);
create policy "Auth can react" on post_reactions for insert with check (auth.uid() = user_id);
create policy "Auth can unreact" on post_reactions for delete using (auth.uid() = user_id);

create policy "Post comments viewable" on post_comments for select using (true);
create policy "Auth can post comment" on post_comments for insert with check (auth.uid() = user_id);
create policy "Auth can delete own post comment" on post_comments for delete using (auth.uid() = user_id);

create policy "Post saves viewable" on post_saves for select using (true);
create policy "Auth can save post" on post_saves for insert with check (auth.uid() = user_id);
create policy "Auth can unsave post" on post_saves for delete using (auth.uid() = user_id);
