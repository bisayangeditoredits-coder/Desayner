'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ExternalLink, Bookmark, Download, Library, ShieldCheck, User } from 'lucide-react';
import Modal from './Modal';

export default function ResourceDetailModal({ resourceId, onClose }) {
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data: resData, error } = await supabase
        .from('resources')
        .select('*, profiles(full_name, username, avatar_url)')
        .eq('id', resourceId)
        .single();

      if (error || !resData) { onClose(); return; }
      setResource(resData);

      if (user) {
        const { data: saveData } = await supabase
          .from('resource_saves')
          .select('id')
          .eq('user_id', user.id)
          .eq('resource_id', resourceId)
          .maybeSingle();
        if (saveData) setSaved(true);
      }
      setLoading(false);
    }
    load();
  }, [resourceId, onClose]);

  async function toggleSave() {
    if (!currentUserId) return;
    const wasSaved = saved;
    setSaved(!wasSaved);
    if (wasSaved) {
      await supabase.from('resource_saves').delete()
        .eq('user_id', currentUserId).eq('resource_id', resourceId);
    } else {
      await supabase.from('resource_saves').insert({ user_id: currentUserId, resource_id: resourceId });
    }
  }

  return (
    <Modal
      title={loading ? 'Loading…' : (resource?.title || 'Resource')}
      size="lg"
      onClose={onClose}
    >
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#9b9b9b' }}>
          Loading resource…
        </div>
      ) : !resource ? null : (
        <div style={{ display: 'flex', height: '100%' }}>

          {/* ── Left: Thumbnail + Description ── */}
          <div style={{ flex: 1, padding: 'var(--space-lg, 2rem)', overflowY: 'auto', borderRight: '1px solid #e2e8f0' }}>
            {/* Thumbnail */}
            <div style={{
              width: '100%', aspectRatio: '16/9',
              background: '#f5f5f5', overflow: 'hidden',
              marginBottom: 'var(--space-lg, 2rem)',
              border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {resource.thumbnail_url
                ? <img src={resource.thumbnail_url} alt={resource.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Library size={48} color="#d0d0d0" />
              }
            </div>

            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0a0a0a', marginBottom: '0.75rem' }}>
              About this resource
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#404040', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
              {resource.description || 'No description provided for this resource.'}
            </p>
          </div>

          {/* ── Right: Meta + Actions ── */}
          <div style={{
            width: '300px', flexShrink: 0,
            padding: 'var(--space-lg, 2rem)',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-md, 1.25rem)',
            background: '#fafafa',
          }}>
            {/* Category badge */}
            <span style={{
              display: 'inline-block', padding: '0.25rem 0.75rem',
              background: '#eef0ff', color: '#0009fa',
              fontSize: '0.7rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              alignSelf: 'flex-start',
            }}>
              {resource.category}
            </span>

            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: 'var(--space-md, 1.25rem)', borderBottom: '1px solid #e2e8f0' }}>
              {resource.profiles?.avatar_url ? (
                <img src={resource.profiles.avatar_url} alt="" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                  <User size={18} color="#9b9b9b" />
                </div>
              )}
              <div>
                <div style={{ fontSize: '0.7rem', color: '#9b9b9b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shared by</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0a0a0a' }}>
                  {resource.profiles?.full_name || resource.profiles?.username}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <a
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-accent"
                style={{ justifyContent: 'center', width: '100%' }}
              >
                <Download size={16} /> Get Resource <ExternalLink size={13} style={{ opacity: 0.7 }} />
              </a>

              <button
                onClick={toggleSave}
                className={saved ? 'btn btn-primary' : 'btn btn-outline'}
                style={{ justifyContent: 'center', width: '100%' }}
              >
                <Bookmark size={16} fill={saved ? 'white' : 'none'} />
                {saved ? 'Saved' : 'Save for later'}
              </button>
            </div>

            {/* Security note */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: 'auto', paddingTop: 'var(--space-md, 1.25rem)', borderTop: '1px solid #e2e8f0' }}>
              <ShieldCheck size={14} color="#94a3b8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Links to an external site. Desayner does not host this file.
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
