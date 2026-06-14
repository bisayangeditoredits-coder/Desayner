'use client';
import { useEffect, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import useToastStore from '@/store/useToastStore';

export default function RealtimeNotifier() {
  const addToast = useToastStore((state) => state.addToast);
  const supabase = useMemo(() => createClient(), []);
  const lastCheckedRef = useRef(new Date().toISOString());

  useEffect(() => {
    let active = true;
    let channel;

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !active) return;

      const userId = user.id;

      channel = supabase.channel(`notifier_${userId}_${Date.now()}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications', 
            filter: `user_id=eq.${userId}` 
          }, 
          async (payload) => {
            if (!active) return;
            const notifId = payload.new.id;
            
            try {
              const { data: notif, error } = await supabase
                .from('notifications')
                .select(`
                  *,
                  actor:profiles!notifications_actor_id_fkey(username, full_name, avatar_url),
                  project:projects(title)
                `)
                .eq('id', notifId)
                .single();

              if (error || !notif) return;
              if (notif.actor_id === userId) return;

              const actorName = notif.actor?.full_name || notif.actor?.username || 'Someone';
              let messageText = '';
              let targetLink = '/notifications';

              if (notif.type === 'like') {
                messageText = `liked your project "${notif.project?.title || 'untitled'}"`;
                if (notif.project_id) targetLink = `/projects/${notif.project_id}`;
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
            } catch (err) {
              console.error('Failed to fetch notification details for toaster:', err);
            }
          }
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [addToast, supabase]);

  return null;
}
