-- Add tools array to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tools text[] DEFAULT '{}'::text[];

-- Add tools array to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tools text[] DEFAULT '{}'::text[];
