'use client';
import { useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * useTyping
 *
 * Lightweight typing indicator using Supabase Realtime BROADCAST.
 * Zero database writes — uses pub/sub only.
 *
 * Sends: { type: 'typing', userId, isTyping: true/false }
 * 500ms debounce on keypress, auto-clears after 3s of silence.
 *
 * Usage:
 *   const { sendTyping, onTyping } = useTyping(conversationId, currentUserId);
 *   // In input onChange: sendTyping()
 *   // In channel setup: pass onTyping to broadcast listener
 */
export function useTyping(conversationId, currentUserId) {
  const supabase      = useMemo(() => createClient(), []);
  const channelRef    = useRef(null);
  const debounceRef   = useRef(null);
  const clearRef      = useRef(null);
  const isTypingRef   = useRef(false);

  /** Subscribe to typing events. Returns unsubscribe fn. */
  const subscribe = useCallback((onTypingChange) => {
    if (!conversationId) return () => {};

    channelRef.current = supabase
      .channel(`typing:${conversationId}`, {
        config: { broadcast: { ack: false, self: false } }
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== currentUserId) {
          onTypingChange(payload.isTyping);
        }
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, currentUserId, supabase]);

  /** Broadcast typing=true, debounce stop after 3s silence */
  const sendTyping = useCallback(() => {
    if (!channelRef.current || !conversationId) return;

    // Clear pending stop
    clearTimeout(debounceRef.current);
    clearTimeout(clearRef.current);

    // Broadcast start only once per keypress
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, isTyping: true },
      });
    }

    // Auto-stop after 3s of silence
    clearRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUserId, isTyping: false },
        });
      }
    }, 3000);
  }, [conversationId, currentUserId]);

  const stopTyping = useCallback(() => {
    clearTimeout(clearRef.current);
    if (isTypingRef.current && channelRef.current) {
      isTypingRef.current = false;
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, isTyping: false },
      });
    }
  }, [currentUserId]);

  return { subscribe, sendTyping, stopTyping };
}
