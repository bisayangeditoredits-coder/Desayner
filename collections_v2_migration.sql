-- ============================================
-- CRELDESK STUDIO — COLLECTIONS V2 MIGRATION
-- ============================================

-- 1. Modify collection_items to allow nulls for project_id and add new foreign keys
alter table public.collection_items alter column project_id drop not null;
alter table public.collection_items add column if not exists asset_id uuid references public.assets(id) on delete cascade;
alter table public.collection_items add column if not exists inspiration_id uuid references public.inspirations(id) on delete cascade;

-- 2. Drop the old unique constraint safely if it exists
do $$
begin
  alter table public.collection_items drop constraint if exists collection_items_collection_id_project_id_key;
end $$;

-- 3. Safely drop constraints if they exist, then add them
do $$
begin
  alter table public.collection_items drop constraint if exists unique_collection_project;
  alter table public.collection_items drop constraint if exists unique_collection_asset;
  alter table public.collection_items drop constraint if exists unique_collection_resource;
  alter table public.collection_items drop constraint if exists unique_collection_inspiration;
  alter table public.collection_items drop constraint if exists one_item_type_only;
end $$;

-- Note: NULLs are not considered equal in unique constraints in Postgres, 
-- so multiple rows with the same collection_id and NULL project_id are allowed.
alter table public.collection_items add constraint unique_collection_project unique(collection_id, project_id);
alter table public.collection_items add constraint unique_collection_asset unique(collection_id, asset_id);
alter table public.collection_items add constraint unique_collection_inspiration unique(collection_id, inspiration_id);

-- 4. Add a check constraint to ensure exactly one item type is non-null
alter table public.collection_items add constraint one_item_type_only check (
  (project_id is not null)::integer + 
  (asset_id is not null)::integer + 
  (inspiration_id is not null)::integer = 1
);
