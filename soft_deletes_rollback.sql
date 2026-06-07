-- Soft Deletes Rollback

-- 1. Recreate Hard Delete Policies
CREATE POLICY "Auth can delete own project" ON projects FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Auth can delete own comment" ON project_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Auth can delete own post" ON community_posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Auth can delete own post comment" ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- 2. Revert SELECT Policies to ignore soft deletes
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Projects viewable" ON projects;
CREATE POLICY "Projects viewable" ON projects FOR SELECT USING (published = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Assets are viewable by everyone" ON assets;
CREATE POLICY "Assets are viewable by everyone" ON assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "Project comments viewable" ON project_comments;
CREATE POLICY "Project comments viewable" ON project_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Post comments viewable" ON post_comments;
CREATE POLICY "Post comments viewable" ON post_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Community posts viewable" ON community_posts;
CREATE POLICY "Community posts viewable" ON community_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Collections viewable" ON collections;
CREATE POLICY "Collections viewable" ON collections FOR SELECT USING (is_private = false OR auth.uid() = user_id);

DROP POLICY IF EXISTS "msg_select" ON messages;
CREATE POLICY "msg_select" ON messages FOR SELECT USING (
  sender_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = messages.conversation_id
    AND cm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "conv_select" ON conversations;
CREATE POLICY "conv_select" ON conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = id
    AND cm.user_id = auth.uid()
  )
);

-- 3. Remove columns
ALTER TABLE profiles DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS is_admin;
ALTER TABLE projects DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE assets DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE project_comments DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE post_comments DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE collections DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE community_posts DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE messages DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE conversations DROP COLUMN IF EXISTS deleted_at;
