-- Soft Deletes Migration
-- This migration transitions the application to a soft delete architecture.

-- 1. Add deleted_at columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE project_comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Add is_admin to profiles for Admin Recovery Tools
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 3. Drop Hard Delete Policies (Enforce Soft Deletes via Update)
DROP POLICY IF EXISTS "Auth can delete own project" ON projects;
DROP POLICY IF EXISTS "Auth can delete own comment" ON project_comments;
DROP POLICY IF EXISTS "Auth can delete own post" ON community_posts;
DROP POLICY IF EXISTS "Auth can delete own post comment" ON post_comments;
DROP POLICY IF EXISTS "Auth can delete own asset" ON assets;
DROP POLICY IF EXISTS "Users can delete their own collections" ON collections;
DROP POLICY IF EXISTS "msg_delete" ON messages;
DROP POLICY IF EXISTS "conv_delete" ON conversations;

-- 4. Recreate SELECT Policies to hide soft-deleted records
-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (deleted_at IS NULL OR auth.uid() = id);

-- Projects
DROP POLICY IF EXISTS "Projects viewable" ON projects;
CREATE POLICY "Projects viewable" ON projects FOR SELECT USING (deleted_at IS NULL AND (published = true OR auth.uid() = user_id));

-- Assets
DROP POLICY IF EXISTS "Assets are viewable by everyone" ON assets;
CREATE POLICY "Assets are viewable by everyone" ON assets FOR SELECT USING (deleted_at IS NULL);

-- Project comments
DROP POLICY IF EXISTS "Project comments viewable" ON project_comments;
CREATE POLICY "Project comments viewable" ON project_comments FOR SELECT USING (deleted_at IS NULL);

-- Post comments
DROP POLICY IF EXISTS "Post comments viewable" ON post_comments;
CREATE POLICY "Post comments viewable" ON post_comments FOR SELECT USING (deleted_at IS NULL);

-- Community posts
DROP POLICY IF EXISTS "Community posts viewable" ON community_posts;
CREATE POLICY "Community posts viewable" ON community_posts FOR SELECT USING (deleted_at IS NULL);

-- Collections
DROP POLICY IF EXISTS "Collections viewable" ON collections;
CREATE POLICY "Collections viewable" ON collections FOR SELECT USING (deleted_at IS NULL AND (is_private = false OR auth.uid() = user_id));

-- Messages
DROP POLICY IF EXISTS "msg_select" ON messages;
CREATE POLICY "msg_select" ON messages FOR SELECT USING (
  deleted_at IS NULL AND (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM conversation_members cm
      WHERE cm.conversation_id = messages.conversation_id
      AND cm.user_id = auth.uid()
    )
  )
);

-- Conversations
DROP POLICY IF EXISTS "conv_select" ON conversations;
CREATE POLICY "conv_select" ON conversations FOR SELECT USING (
  deleted_at IS NULL AND (
    EXISTS (
      SELECT 1 FROM conversation_members cm
      WHERE cm.conversation_id = id
      AND cm.user_id = auth.uid()
    )
  )
);
