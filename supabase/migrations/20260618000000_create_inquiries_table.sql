-- Create inquiries table
CREATE TABLE public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_type TEXT NOT NULL,
    budget TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) to secure the table
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own inquiries
CREATE POLICY "Users can insert their own inquiries" 
    ON public.inquiries FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

-- Allow users to read inquiries they sent or received
CREATE POLICY "Users can view their own inquiries" 
    ON public.inquiries FOR SELECT 
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create an index for faster queries on receiver_id
CREATE INDEX idx_inquiries_receiver_id ON public.inquiries(receiver_id);
