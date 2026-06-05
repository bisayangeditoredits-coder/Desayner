'use client';
import { useState, useEffect, Suspense, lazy } from 'react';
import { createClient } from '@/lib/supabase/client';
import '../../App.css';

/**
 * Dynamic import — the entire chat UI is excluded from the initial bundle.
 * It only loads when the user visits /messages, keeping the home/projects
 * pages fast even on slow connections.
 */
const MessagesPage = lazy(() => import('@/components/messaging/MessagesPage'));

function ChatSkeleton() {
  return (
    <div className="messages-layout messages-layout--skeleton">
      <div className="messages-left">
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #e8e8e8' }}>
          <div style={{ height: '1.2rem', width: '80px', background: '#f0f0f0', borderRadius: 4, marginBottom: '1rem' }} />
          <div style={{ height: '36px', background: '#f5f5f5', borderRadius: 8 }} />
        </div>
        {[1,2,3].map(i => (
          <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.9rem 1rem', borderBottom: '1px solid #f5f5f5' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0f0f0', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: '0.8rem', background: '#f0f0f0', borderRadius: 4, marginBottom: 8, width: '60%' }} />
              <div style={{ height: '0.7rem', background: '#f5f5f5', borderRadius: 4, width: '90%' }} />
            </div>
          </div>
        ))}
      </div>
      <div className="messages-right">
        <div className="chat-window chat-window--empty">
          <div className="chat-window__empty-state">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💬</div>
            <p style={{ color: '#9b9b9b', fontSize: '0.875rem' }}>Loading messages…</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MessagesRoute() {
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
      setAuthLoading(false);
    });
  }, []);

  return (
    <>
        {authLoading ? (
          <ChatSkeleton />
        ) : !userId ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <p style={{ color: '#9b9b9b', fontSize: '0.875rem' }}>
              Please <a href="/login" style={{ color: '#0009fa', fontWeight: 700 }}>sign in</a> to access messages.
            </p>
          </div>
        ) : (
          <Suspense fallback={<ChatSkeleton />}>
            <MessagesPage currentUserId={userId} />
          </Suspense>
        )}
      </>
  );
}
