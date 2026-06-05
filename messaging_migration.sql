-- ============================================================
-- Desayner Messaging System — SQL Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── 1. Conversations ──────────────────────────────────────
-- Stores 1:1 conversation between two users.
-- user1_id < user2_id (enforced by CHECK) prevents duplicate rows
-- for the same pair of users.
CREATE TABLE IF NOT EXISTS conversations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_msg    text,
  last_msg_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user1_id, user2_id),
  CHECK (user1_id < user2_id)          -- canonical ordering; prevents duplicate pairs
);

-- ── 2. Messages ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  body            text,
  image_url       text,
  seen            boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT body_or_image CHECK (body IS NOT NULL OR image_url IS NOT NULL)
);

-- ── 3. Conversation Members (unread state per user) ────────
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id uuid        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES profiles(id)     ON DELETE CASCADE,
  unread_count    int         NOT NULL DEFAULT 0,
  last_seen_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- ── 4. Indexes ────────────────────────────────────────────
-- Fetch messages for a conversation, newest first
CREATE INDEX IF NOT EXISTS idx_messages_conv
  ON messages (conversation_id, created_at DESC);

-- Fetch conversations for user1 / user2 by recency
CREATE INDEX IF NOT EXISTS idx_conv_user1
  ON conversations (user1_id, last_msg_at DESC);

CREATE INDEX IF NOT EXISTS idx_conv_user2
  ON conversations (user2_id, last_msg_at DESC);

-- Unread lookup
CREATE INDEX IF NOT EXISTS idx_conv_members_user
  ON conversation_members (user_id);

-- ── 5. Row Level Security ─────────────────────────────────
ALTER TABLE conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

-- Conversations: visible only to participants
CREATE POLICY "conv_select" ON conversations
  FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "conv_insert" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "conv_update" ON conversations
  FOR UPDATE USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Messages: visible only to conversation participants
CREATE POLICY "msg_select" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "msg_insert" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT id FROM conversations
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

CREATE POLICY "msg_update" ON messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

-- Conversation members: users manage their own row only
CREATE POLICY "cm_all" ON conversation_members
  FOR ALL USING (user_id = auth.uid());

-- ── 6. Realtime Publication ───────────────────────────────
-- Enable Supabase Realtime for messages and conversations.
-- Run these only if not already in the publication.
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_members;

-- ── 8. Increment unread count ────────────────────────────
-- Called server-side when a message is sent to increment the
-- recipient's unread_count atomically.
CREATE OR REPLACE FUNCTION increment_unread(p_conv_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO conversation_members (conversation_id, user_id, unread_count)
  VALUES (p_conv_id, p_user_id, 1)
  ON CONFLICT (conversation_id, user_id)
  DO UPDATE SET unread_count = conversation_members.unread_count + 1;
END;
$$;

