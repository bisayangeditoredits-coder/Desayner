-- ==========================================
-- CREATE SAVED JOBS TABLE
-- Run this in your Supabase SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL,
    job_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, job_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved jobs" ON public.saved_jobs;
CREATE POLICY "Users can view their own saved jobs"
ON public.saved_jobs FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own saved jobs" ON public.saved_jobs;
CREATE POLICY "Users can insert their own saved jobs"
ON public.saved_jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved jobs" ON public.saved_jobs;
CREATE POLICY "Users can delete their own saved jobs"
ON public.saved_jobs FOR DELETE
USING (auth.uid() = user_id);
