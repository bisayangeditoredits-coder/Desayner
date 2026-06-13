'use client';
import { useState, useMemo} from 'react';
import { ImageIcon, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from './UserAvatar';
import ImageUpload from './ImageUpload';

const POST_TYPES = [
  { value: 'share', label: 'Share Work', color: '#231f20' },
  { value: 'help', label: 'Ask for Help', color: '#ff3b3b' },
  { value: 'feedback', label: 'Get Feedback', color: '#0ea5e9' },
];

export default function PostComposer({ currentUser, onPosted }) {
  const [body, setBody] = useState('');
  const [postType, setPostType] = useState('share');
  const [imageUrl, setImageUrl] = useState('');
  const [imageInput, setImageInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  async function submit(e) {
    e.preventDefault();
    if (!body.trim() || !currentUser) return;
    setSubmitting(true);
    const { data, error } = await supabase.from('community_posts').insert({
      user_id: currentUser.id,
      body: body.trim(),
      post_type: postType,
      image_url: imageUrl.trim() || null,
    }).select('*, profiles!community_posts_user_id_fkey(username, full_name, avatar_url)').single();
    if (!error && data) {
      setBody('');
      setImageUrl('');
      setImageInput(false);
      setPostType('share');
      onPosted && onPosted(data);
    }
    setSubmitting(false);
  }

  if (!currentUser) return null;

  return (
    <div style={{ background: 'white', border: '1px solid #e8e8e8', padding: '1.25rem', borderRadius: '12px' }}>
      {/* Type selector */}
      <div className="composer-type-selector">
        {POST_TYPES.map(t => (
          <button
            key={t.value}
            onClick={() => setPostType(t.value)}
            className="composer-type-btn"
            style={{
              borderColor: postType === t.value ? t.color : '#e8e8e8',
              background: postType === t.value ? t.color : 'white',
              color: postType === t.value ? 'white' : '#6b6b6b',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <UserAvatar src={currentUser.avatar_url} name={currentUser.full_name || currentUser.username} size={36} />
          <div style={{ flex: 1 }}>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={
                postType === 'help'
                  ? 'What do you need help with?'
                  : postType === 'feedback'
                  ? 'Share your work and ask for feedback...'
                  : 'Share something with the community...'
              }
              rows={3}
              style={{
                width: '100%', padding: '0.6rem 0', border: 'none',
                borderBottom: '1px solid #e8e8e8', background: 'transparent',
                fontSize: '0.9rem', outline: 'none', resize: 'none',
                fontFamily: 'inherit', color: '#231f20', lineHeight: 1.5,
              }}
            />

            {imageInput && (
              <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                <ImageUpload
                  label="Attach Image"
                  folder="community/posts"
                  value={imageUrl}
                  onUploaded={url => setImageUrl(url)}
                  onRemove={() => { setImageUrl(''); setImageInput(false); }}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem' }}>
              {!imageInput && !imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageInput(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9b9b9b', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: 0 }}
                >
                  <ImageIcon size={16} /> Add Image
                </button>
              )}
              {/* Spacer if button is hidden */}
              {(imageInput || imageUrl) && <div />}
              <button
                type="submit"
                disabled={submitting || !body.trim()}
                style={{
                  padding: '0.5rem 1.25rem', background: '#231f20', color: 'white',
                  border: 'none', fontSize: '0.8rem', fontWeight: 700,
                  cursor: submitting || !body.trim() ? 'not-allowed' : 'pointer',
                  opacity: !body.trim() ? 0.4 : 1, fontFamily: 'inherit', borderRadius: '8px',
                }}
              >
                {submitting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
