'use client';
import { useState, useMemo} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const EMOJIS = ['❤️', '🔥', '👏', '😱', '💡'];

export default function ReactionBar({ postId, currentUserId, initialReaction = null, reactionsCount = 0 }) {
  const [userReaction, setUserReaction] = useState(initialReaction);
  const [count, setCount] = useState(reactionsCount);
  const [showPicker, setShowPicker] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  async function react(emoji) {
    if (!currentUserId) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setShowPicker(false);
    const prev = userReaction;

    if (prev === emoji) {
      setUserReaction(null);
      setCount(c => Math.max(0, c - 1));
      await supabase.from('post_reactions').delete()
        .eq('user_id', currentUserId).eq('post_id', postId);
    } else {
      if (!prev) setCount(c => c + 1);
      setUserReaction(emoji);
      await supabase.from('post_reactions').upsert({
        user_id: currentUserId,
        post_id: postId,
        emoji,
      }, { onConflict: 'user_id,post_id' });
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        onClick={() => setShowPicker(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.3rem 0.7rem',
          border: '1px solid #e8e8e8',
          background: userReaction ? '#f5f5f5' : 'white',
          borderRadius: '0px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: 600,
          fontFamily: 'inherit',
          color: '#0a0a0a',
        }}
      >
        {userReaction || '❤️'} {count > 0 && count}
      </button>

      {showPicker && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 0, marginBottom: '4px',
          background: 'white', border: '1px solid #e8e8e8',
          display: 'flex', padding: '0.4rem', gap: '0.25rem',
          zIndex: 100,
        }}>
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => react(emoji)}
              style={{
                fontSize: '1.2rem', padding: '0.3rem', background: 'none', border: 'none',
                cursor: 'pointer', borderRadius: '0px',
                backgroundColor: userReaction === emoji ? '#f0f0f0' : 'transparent',
                transition: 'transform 0.1s',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
