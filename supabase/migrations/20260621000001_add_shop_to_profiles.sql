-- Add shop JSONB column to profiles
-- This stores: { name, logo_url, products: [...] }
-- Zero extra DB queries — already fetched in profiles.*

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS shop JSONB DEFAULT '{}'::jsonb;
