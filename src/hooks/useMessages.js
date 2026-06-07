'use client';
import { useState, useEffect, useRef, useCallback, useReducer, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * useMessages
 *
 * Loads messages for ONE active conversation and subscribes to realtime updates.
 * Unsubscribes immediately when conversationId changes or component unmounts.
 *
 * Performance:
 * - useReducer to avoid array spread on each new message
 * - Deduplication via a Set of seen IDs
 * - Cursor-based pagination (30 messages per page)
 * - AbortController on fetch cleanup
 */

function messagesReducer(state, action) {
  switch (action.type) {
    case 'SET_INITIAL':
      return { messages: action.payload, seenIds: new Set(action.payload.map(m => m.id)) };
    case 'PREPEND': {
      // Load older messages at top
      const newIds = action.payload.filter(m => !state.seenIds.has(m.id));
      if (!newIds.length) return state;
      const nextSeen = new Set(state.seenIds);
      newIds.forEach(m => nextSeen.add(m.id));
      return { messages: [...newIds, ...state.messages], seenIds: nextSeen };
    }
    case 'APPEND': {
      // New message from realtime
      if (state.seenIds.has(action.payload.id)) return state;
      const nextSeen = new Set(state.seenIds);
      nextSeen.add(action.payload.id);
      return { messages: [...state.messages, action.payload], seenIds: nextSeen };
    }
    case 'UPDATE': {
      // Message was updated (e.g. marked as seen)
      if (!state.seenIds.has(action.payload.id)) return state;
      return {
        ...state,
        messages: state.messages.map(m => m.id === action.payload.id ? action.payload : m)
      };
    }
    default:
      return state;
  }
}

export function useMessages(conversationId) {
  const [state, dispatch] = useReducer(messagesReducer, { messages: [], seenIds: new Set() });
  const [loading, setLoading]       = useState(false);
  const [sending, setSending]       = useState(false);
  const [hasMore, setHasMore]       = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError]           = useState(null);

  const channelRef  = useRef(null);
  const mountedRef  = useRef(true);
  const supabase = useMemo(() => createClient(), []);

  // ── Initial load ─────────────────────────────────────────
  useEffect(() => {
    if (!conversationId) return;
    mountedRef.current = true;

    const controller = new AbortController();

    async function loadInitial() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/messages?conversationId=${conversationId}&limit=30`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('Failed to load messages');
        const { messages, nextCursor: cursor, hasMore: more } = await res.json();
        if (!mountedRef.current) return;
        dispatch({ type: 'SET_INITIAL', payload: messages });
        setNextCursor(cursor);
        setHasMore(more);
      } catch (err) {
        if (err.name === 'AbortError') return;
        if (mountedRef.current) setError('Failed to load messages');
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    loadInitial();

    // ── Realtime subscription ──────────────────────────────
    channelRef.current = supabase
      .channel(`conv:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          dispatch({ type: 'APPEND', payload: payload.new });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!mountedRef.current) return;
          dispatch({ type: 'UPDATE', payload: payload.new });
        }
      )
      .subscribe();

    // Mark seen when opening conversation
    fetch('/api/messages/seen', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId }),
    }).catch(() => {});

    return () => {
      mountedRef.current = false;
      controller.abort();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, supabase]);

  // ── Load older messages (pagination) ─────────────────────
  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/messages?conversationId=${conversationId}&cursor=${encodeURIComponent(nextCursor)}&limit=30`
      );
      if (!res.ok) throw new Error('Failed');
      const { messages, nextCursor: cursor, hasMore: more } = await res.json();
      dispatch({ type: 'PREPEND', payload: messages });
      setNextCursor(cursor);
      setHasMore(more);
    } catch {
      // silent fail for pagination
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [conversationId, hasMore, nextCursor, loading]);

  // ── Send message ─────────────────────────────────────────
  const sendMessage = useCallback(async ({ body, imageUrl }) => {
    if (!conversationId) return null;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, body, imageUrl }),
      });
      if (!res.ok) {
        const { error: errMsg } = await res.json();
        throw new Error(errMsg || 'Failed to send');
      }
      const { message } = await res.json();
      // Realtime will APPEND it, but we add optimistically in case of delay
      dispatch({ type: 'APPEND', payload: message });
      return message;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      if (mountedRef.current) setSending(false);
    }
  }, [conversationId]);

  return {
    messages: state.messages,
    loading,
    sending,
    hasMore,
    error,
    sendMessage,
    loadMore,
  };
}
