-- ─── Design Feedback Board Migration ───────────────────────────────────────
-- Run this in Supabase SQL Editor

-- 1. Feedback Requests table
CREATE TABLE IF NOT EXISTS feedback_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  feedback_type TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'implemented')),
  comments_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Feedback Comments table
CREATE TABLE IF NOT EXISTS feedback_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feedback_id UUID REFERENCES feedback_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  parent_id UUID REFERENCES feedback_comments(id) ON DELETE CASCADE,
  is_helpful BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Feedback Helpful tracking
CREATE TABLE IF NOT EXISTS feedback_helpful (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID REFERENCES feedback_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- 4. Indexes for performance at scale
CREATE INDEX IF NOT EXISTS idx_feedback_requests_user ON feedback_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_status ON feedback_requests(status);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_created ON feedback_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_feedback ON feedback_comments(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_comments_user ON feedback_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_helpful_comment ON feedback_helpful(comment_id);
CREATE INDEX IF NOT EXISTS idx_feedback_requests_feedback_type ON feedback_requests USING GIN(feedback_type);

-- 5. Enable Row Level Security
ALTER TABLE feedback_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_helpful ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for feedback_requests
CREATE POLICY "Anyone can view feedback requests"
  ON feedback_requests FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own feedback requests"
  ON feedback_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback requests"
  ON feedback_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feedback requests"
  ON feedback_requests FOR DELETE
  USING (auth.uid() = user_id);

-- 7. RLS Policies for feedback_comments
CREATE POLICY "Anyone can view comments"
  ON feedback_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON feedback_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON feedback_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON feedback_comments FOR DELETE
  USING (auth.uid() = user_id);

-- 8. RLS Policies for feedback_helpful
CREATE POLICY "Anyone can view helpful marks"
  ON feedback_helpful FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can mark helpful"
  ON feedback_helpful FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unmark helpful"
  ON feedback_helpful FOR DELETE
  USING (auth.uid() = user_id);

-- 9. Function to increment comments count
CREATE OR REPLACE FUNCTION increment_feedback_comments_count(f_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE feedback_requests
  SET comments_count = comments_count + 1
  WHERE id = f_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function to decrement comments count
CREATE OR REPLACE FUNCTION decrement_feedback_comments_count(f_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE feedback_requests
  SET comments_count = GREATEST(comments_count - 1, 0)
  WHERE id = f_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Function to increment feedback view count
CREATE OR REPLACE FUNCTION increment_feedback_view(f_id UUID)
RETURNS INT AS $$
DECLARE
  new_count INT;
BEGIN
  UPDATE feedback_requests
  SET views_count = views_count + 1
  WHERE id = f_id
  RETURNING views_count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Trigger to update updated_at on feedback changes
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_requests_updated_at
  BEFORE UPDATE ON feedback_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();