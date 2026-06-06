-- 1. Create inspiration_saves table
create table if not exists inspiration_saves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  inspiration_id uuid references public.inspirations on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, inspiration_id)
);

-- 2. Add saves_count to inspirations table if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'inspirations' and column_name = 'saves_count') then
    alter table public.inspirations add column saves_count int default 0;
  end if;
end $$;

-- 3. Trigger to update saves_count on inspirations
create or replace function update_inspiration_saves_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update inspirations set saves_count = coalesce(saves_count, 0) + 1 where id = NEW.inspiration_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update inspirations set saves_count = coalesce(saves_count, 0) - 1 where id = OLD.inspiration_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_inspiration_save on inspiration_saves;
create trigger on_inspiration_save after insert or delete on inspiration_saves
  for each row execute procedure update_inspiration_saves_count();

-- 4. Enable RLS
alter table inspiration_saves enable row level security;

-- 5. RLS Policies
create policy "Inspiration saves viewable by everyone" on inspiration_saves for select using (true);
create policy "Auth can save inspiration" on inspiration_saves for insert with check (auth.uid() = user_id);
create policy "Auth can unsave inspiration" on inspiration_saves for delete using (auth.uid() = user_id);
