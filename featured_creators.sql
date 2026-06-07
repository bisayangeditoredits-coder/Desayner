-- 1. Add is_admin column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 2. Create featured_creators table
CREATE TABLE IF NOT EXISTS public.featured_creators (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  banner_url text NOT NULL,
  featured_title text NOT NULL,
  featured_description text,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS on featured_creators
ALTER TABLE public.featured_creators ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for featured_creators
-- Public can read all active featured creators
CREATE POLICY "Public can view featured creators"
  ON public.featured_creators FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage featured creators"
  ON public.featured_creators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =========================================================================
-- 5. PROFESSIONAL SCRIPT: ADD FEATURED CREATORS
-- =========================================================================
-- Instructions: 
-- 1. Copy and paste this script into your Supabase SQL Editor.
-- 2. Change the 'target_username' below to the exact username you want to feature.
-- 3. Update the banner_url, title, and description.
-- 4. Run the query!
-- =========================================================================

DO $$ 
DECLARE
  target_username TEXT := 'bisayangeditor'; -- 👈 CHANGE THIS TO THE USERNAME YOU WANT TO FEATURE
  target_user_id UUID;
BEGIN
  -- Find the User ID based on the username (Case-Insensitive)
  SELECT id INTO target_user_id 
  FROM public.profiles 
  WHERE username ILIKE target_username 
  LIMIT 1;

  -- If user exists, insert them into the featured_creators table
  IF target_user_id IS NOT NULL THEN
    
    INSERT INTO public.featured_creators (
      user_id, 
      banner_url, 
      featured_title, 
      featured_description, 
      start_date, 
      end_date, 
      is_active
    ) 
    VALUES (
      target_user_id,
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop', -- 👈 CHANGE BANNER URL
      'Top Tier Designer', -- 👈 CHANGE TITLE
      'Consistently delivering high-quality and dynamic designs.', -- 👈 CHANGE DESCRIPTION
      now(), 
      now() + interval '30 days', -- Featured for 30 days
      true
    );

    RAISE NOTICE 'Success! Added % to Featured Creators.', target_username;
  ELSE
    RAISE NOTICE 'Error: User % not found.', target_username;
  END IF;
END $$;
