-- ==========================================
-- SUPABASE RLS (ROW LEVEL SECURITY) AUDIT
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. PROFILES TABLE
-- Ensure profiles can only be modified by their owners
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." 
ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- 2. PROJECTS TABLE
-- Ensure projects can only be modified or deleted by their creators
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Projects are viewable by everyone." ON public.projects;
CREATE POLICY "Projects are viewable by everyone." 
ON public.projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create projects." ON public.projects;
CREATE POLICY "Authenticated users can create projects." 
ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects." ON public.projects;
CREATE POLICY "Users can update their own projects." 
ON public.projects FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects." ON public.projects;
CREATE POLICY "Users can delete their own projects." 
ON public.projects FOR DELETE USING (auth.uid() = user_id);


-- Success! Your core tables are now secured against unauthorized edits.
