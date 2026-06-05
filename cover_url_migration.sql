-- Add cover_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url text;
