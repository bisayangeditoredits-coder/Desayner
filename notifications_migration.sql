-- ============================================
-- CRELDESK STUDIO — NOTIFICATIONS MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create notifications table
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  actor_id uuid references profiles(id) on delete cascade not null,
  type text check (type in ('like', 'save', 'comment', 'follow')) not null,
  project_id uuid references projects(id) on delete cascade,
  read boolean default false,
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table notifications enable row level security;

-- 3. Policies
create policy "Users can view their own notifications" 
on notifications for select using (auth.uid() = user_id);

create policy "Users can update their own notifications (mark read)" 
on notifications for update using (auth.uid() = user_id);

create policy "System can insert notifications" 
on notifications for insert with check (true);

-- 4. Triggers to auto-create notifications

-- LIKE trigger
create or replace function handle_new_like() returns trigger as $$
declare
  target_user_id uuid;
begin
  select user_id into target_user_id from projects where id = new.project_id;
  if target_user_id != new.user_id then
    insert into notifications (user_id, actor_id, type, project_id)
    values (target_user_id, new.user_id, 'like', new.project_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_project_like on project_likes;
create trigger on_project_like
  after insert on project_likes
  for each row execute procedure handle_new_like();


-- SAVE trigger
create or replace function handle_new_save() returns trigger as $$
declare
  target_user_id uuid;
begin
  select user_id into target_user_id from projects where id = new.project_id;
  if target_user_id != new.user_id then
    insert into notifications (user_id, actor_id, type, project_id)
    values (target_user_id, new.user_id, 'save', new.project_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_project_save on project_saves;
create trigger on_project_save
  after insert on project_saves
  for each row execute procedure handle_new_save();


-- COMMENT trigger
create or replace function handle_new_comment() returns trigger as $$
declare
  target_user_id uuid;
begin
  select user_id into target_user_id from projects where id = new.project_id;
  if target_user_id != new.user_id then
    insert into notifications (user_id, actor_id, type, project_id)
    values (target_user_id, new.user_id, 'comment', new.project_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_project_comment on project_comments;
create trigger on_project_comment
  after insert on project_comments
  for each row execute procedure handle_new_comment();


-- FOLLOW trigger
create or replace function handle_new_follow() returns trigger as $$
begin
  insert into notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_user_follow on follows;
create trigger on_user_follow
  after insert on follows
  for each row execute procedure handle_new_follow();
