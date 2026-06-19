'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import useToastStore from '@/store/useToastStore';

const NotificationsContext = createContext(null);

function buildToast(notif, actor) {
  const actorName = actor?.full_name || actor?.username || 'Someone';
  let messageText = '';
  let targetLink = '/notifications';

  if (notif.type === 'like') {
    messageText = 'liked your project';
    if (notif.project_id) targetLink = `/projects/${notif.project_id}`;
  } else if (notif.type === 'comment') {
    messageText = 'commented on your project';
    if (notif.project_id) targetLink = `/projects/${notif.project_id}`;
  } else if (notif.type === 'save') {
    messageText = 'saved your project';
    if (notif.project_id) targetLink = `/projects/${notif.project_id}`;
  } else if (notif.type === 'follow') {
    messageText = 'started following you';
    if (actor?.username) targetLink = `/profile/${actor.username}`;
  } else {
    messageText = 'interacted with you';
  }

  return {
    type: notif.type,
    title: actorName,
    message: messageText,
    avatarUrl: actor?.avatar_url,
    link: targetLink,
    duration: 5000,
  };
}

export function NotificationsProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const addToast = useToastStore((s) => s.addToast);
  const supabase = useMemo(() => createClient(), []);
  const actorCache = useRef(new Map());

  useEffect(() => {
    let mounted = true;
    let channel;
    let fallbackInterval;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (mounted) setUnreadCount(count || 0);

      channel = supabase
        .channel(`notifications_${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, async (payload) => {
          if (!mounted || payload.new.actor_id === user.id) return;

          setUnreadCount((c) => c + 1);

          const actorId = payload.new.actor_id;
          let actor = actorCache.current.get(actorId);
          if (!actor && actorId) {
            const { data } = await supabase
              .from('profiles')
              .select('username, full_name, avatar_url')
              .eq('id', actorId)
              .single();
            actor = data;
            if (actor) actorCache.current.set(actorId, actor);
          }

          addToast(buildToast(payload.new, actor));
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' && !fallbackInterval) {
            fallbackInterval = setInterval(async () => {
              const { count: c } = await supabase
                .from('notifications')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('read', false);
              if (mounted) setUnreadCount(c || 0);
            }, 30_000);
          } else if (status === 'SUBSCRIBED' && fallbackInterval) {
            clearInterval(fallbackInterval);
            fallbackInterval = null;
          }
        });
    }

    init();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [supabase, addToast]);

  const value = useMemo(
    () => ({ unreadCount, setUnreadCount }),
    [unreadCount],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return ctx;
}
