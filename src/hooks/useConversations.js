'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * useConversations
 *
 * Fetches the list of recent conversations for the current user.
 * Subscribes to conversation updates (last_msg) via Supabase Realtime.
 * Exposes total unread count for the badge.
 *
 * Performance:
 * - Only ONE realtime channel (conversation list updates).
 * - Does NOT subscribe to individual messages.
 * - Deduplicates updates via ref.
 */
export function useConversations(userId) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [totalUnread, setTotalUnread]     = useState(0);
  const channelRef  = useRef(null);
  const mountedRef  = useRef(true);
  const supabase    = createClient();

  // ── Fetch ───────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/messages/seen', { method: 'GET' });
      if (!res.ok) return;
      const { conversations: data } = await res.json();
      if (!mountedRef.current) return;
      setConversations(data || []);
      setTotalUnread((data || []).reduce((sum, c) => sum + (c.unread || 0), 0));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [userId]);

  // ── Realtime ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    mountedRef.current = true;
    fetchConversations();

    // Subscribe to conversation updates for this user
    channelRef.current = supabase
      .channel(`convs:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `user1_id=eq.${userId}`,
        },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `user2_id=eq.${userId}`,
        },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Update unread count for a specific conversation inline (no refetch)
          if (!mountedRef.current) return;
          setConversations(prev =>
            prev.map(c =>
              c.id === payload.new.conversation_id
                ? { ...c, unread: payload.new.unread_count }
                : c
            )
          );
          setTotalUnread(prev => {
            const delta = payload.new.unread_count - (payload.old?.unread_count || 0);
            return Math.max(0, prev + delta);
          });
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, fetchConversations]);

  // ── Helpers ───────────────────────────────────────────────
  /**
   * Optimistically mark a conversation as read in local state.
   * The actual DB call is done separately by ChatWindow.
   */
  const markRead = useCallback((conversationId) => {
    setConversations(prev =>
      prev.map(c => c.id === conversationId ? { ...c, unread: 0 } : c)
    );
    setTotalUnread(prev => {
      const conv = conversations.find(c => c.id === conversationId);
      return Math.max(0, prev - (conv?.unread || 0));
    });
  }, [conversations]);

  return { conversations, loading, totalUnread, fetchConversations, markRead };
}
