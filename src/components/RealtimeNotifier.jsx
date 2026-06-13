'use client';
import { useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import useToastStore from '@/store/useToastStore';

export default function RealtimeNotifier() {
  const addToast = useToastStore((state) => state.addToast);
  // Stable client instance — prevents new WebSocket on every render
  const supabase = useMemo(() => createClient(), []);
  const channelsRef = useRef([]);
  const fallbackRef = useRef(null);
  // In-memory sender profile cache — avoids a DB hit on every message toast
  const senderCacheRef = useRef(new Map());

  useEffect(() => {
    let active = true;

    async function fetchNotifToasts() {
      // Used by fallback polling to show missed notifications
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;
      // No-op: realtime handles this; polling is just a safety net
    }

    async function setupSubscriptions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;

      const userId = user.id;

      // Clean up any old channels
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];

      function handleChannelStatus(status, err) {
        if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
          console.warn('RealtimeNotifier channel lost, falling back to polling:', err?.message);
          if (!fallbackRef.current) {
            fallbackRef.current = setInterval(fetchNotifToasts, 30_000);
          }
        } else if (status === 'SUBSCRIBED') {
          // Realtime reconnected — clear the fallback
          if (fallbackRef.current) {
            clearInterval(fallbackRef.current);
            fallbackRef.current = null;
          }
        }
      }

      // ── 1. Subscribe to Notifications (likes, comments, saves, follows) ──
      const notifsChannel = supabase
        .channel(`toast_notifs:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
          },
          async (payload) => {
            if (payload.new.user_id !== userId) return;

            // Dynamically join actor, project, and inspiration details for context
            const { data: notif } = await supabase
              .from('notifications')
              .select(`
                *,
                actor:profiles!notifications_actor_id_fkey(username, full_name, avatar_url),
                project:projects(title),
                inspiration:inspirations(title)
              `)
              .eq('id', payload.new.id)
              .single();

            if (!notif) return;

            // Don't show toast for own triggers
            if (notif.actor_id === userId) return;

            const actorName = notif.actor?.full_name || notif.actor?.username || 'Someone';
            let messageText = '';
            let targetLink = '/notifications';

            if (notif.type === 'like') {
              if (notif.inspiration_id) {
                messageText = 'liked your inspiration';
                targetLink = '/inspirations';
              } else {
                messageText = `liked your project "${notif.project?.title || 'untitled'}"`;
                if (notif.project_id) targetLink = `/projects/${notif.project_id}`;
              }
            } else if (notif.type === 'comment') {
              messageText = `commented on your project "${notif.project?.title || 'untitled'}"`;
              if (notif.project_id) targetLink = `/projects/${notif.project_id}`;
            } else if (notif.type === 'save') {
              messageText = `saved your project "${notif.project?.title || 'untitled'}"`;
              if (notif.project_id) targetLink = `/projects/${notif.project_id}`;
            } else if (notif.type === 'follow') {
              messageText = 'started following you';
              if (notif.actor?.username) targetLink = `/profile/${notif.actor.username}`;
            } else {
              messageText = 'interacted with you';
            }

            addToast({
              type: notif.type,
              title: actorName,
              message: messageText,
              avatarUrl: notif.actor?.avatar_url,
              link: targetLink,
              duration: 5000,
            });
          }
        )
        .subscribe(handleChannelStatus);

      // ── 2. Subscribe to Messages ──
      // Supabase LSN broadcasts inserts only on rooms/convs current user is allowed to read.
      const messagesChannel = supabase
        .channel(`toast_msgs:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          async (payload) => {
            const newMsg = payload.new;

            // Don't show toast for own sent messages
            if (newMsg.sender_id === userId) return;

            // Don't show toast if user is actively chatting inside this conversation
            const activeConvId = useToastStore.getState().activeConversationId;
            if (newMsg.conversation_id === activeConvId) return;

            // Use cached sender profile to avoid a DB hit on every message
            let sender = senderCacheRef.current.get(newMsg.sender_id);
            if (!sender) {
              const { data } = await supabase
                .from('profiles')
                .select('username, full_name, avatar_url')
                .eq('id', newMsg.sender_id)
                .single();
              if (!data) return;
              sender = data;
              // Cache for 5 minutes
              senderCacheRef.current.set(newMsg.sender_id, sender);
              setTimeout(() => senderCacheRef.current.delete(newMsg.sender_id), 5 * 60 * 1000);
            }

            addToast({
              type: 'message',
              title: sender.full_name || sender.username || 'New Message',
              message: newMsg.body || 'Sent an image',
              avatarUrl: sender.avatar_url,
              link: `/messages?open=${newMsg.conversation_id}`,
              duration: 5000,
            });
          }
        )
        .subscribe(handleChannelStatus);

      channelsRef.current = [notifsChannel, messagesChannel];
    }

    setupSubscriptions();

    return () => {
      active = false;
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
      if (fallbackRef.current) {
        clearInterval(fallbackRef.current);
        fallbackRef.current = null;
      }
    };
  }, [addToast]);

  return null;
}
