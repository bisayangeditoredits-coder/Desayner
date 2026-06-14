'use client';
import { useState, useEffect, use, useMemo} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Bookmark, Download, Library, ShieldCheck, User } from 'lucide-react';
import { stripCloudinaryProxy } from '@/lib/utils';
import '../../../App.css';

export default function ResourceDetailPage({ params }) {
  const { id } = use(params);
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      // Fetch resource details
      const { data: resData, error } = await supabase
        .from('resources')
        .select('*, profiles(full_name, username, avatar_url)')
        .eq('id', id)
        .single();

      if (error || !resData) {
        router.push('/resources');
        return;
      }
      setResource(resData);

      // Check if saved
      if (user) {
        const { data: saveData } = await supabase
          .from('resource_saves')
          .select('id')
          .eq('user_id', user.id)
          .eq('resource_id', id)
          .maybeSingle();
        if (saveData) setSaved(true);
      }

      setLoading(false);
    }
    load();
  }, [id, router]);

  async function toggleSave() {
    if (!currentUserId) {
      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
      return;
    }
    const wasSaved = saved;
    setSaved(!wasSaved);

    if (wasSaved) {
      await supabase.from('resource_saves').delete()
        .eq('user_id', currentUserId)
        .eq('resource_id', id);
    } else {
      await supabase.from('resource_saves').insert({
        user_id: currentUserId,
        resource_id: id
      });
    }
  }

  if (loading) {
    return (
      <>
          <div style={{ padding: '4rem', textAlign: 'center', color: '#9b9b9b' }}>Loading...</div>
      </>
    );
  }

  if (!resource) return null;

  return (
    <>
        
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
          {/* Back */}
          <Link href="/resources" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#9b9b9b', fontWeight: 600, marginBottom: '2rem', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back to Resources
          </Link>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2.5rem', alignItems: 'flex-start' }}>
            
            {/* Left: Thumbnail & Description */}
            <div>
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#f5f5f5', borderRadius: '8px', overflow: 'hidden', marginBottom: '2rem', border: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {resource.thumbnail_url ? (
                  <img src={stripCloudinaryProxy(resource.thumbnail_url)} alt={resource.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <Library size={48} color="#d0d0d0" />
                )}
              </div>

              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#231f20', marginBottom: '1rem' }}>About this resource</h2>
              <div style={{ fontSize: '0.95rem', color: '#404040', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {resource.description || 'No description provided for this resource.'}
              </div>
            </div>

            {/* Right: Details & Actions */}
            <div style={{ background: 'white', border: '1px solid #e8e8e8', borderRadius: '8px', padding: '1.5rem', position: 'sticky', top: '80px' }}>
              <div style={{ display: 'inline-block', padding: '0.3rem 0.8rem', background: '#eef0ff', color: '#2d43e8', fontSize: '0.75rem', fontWeight: 700, borderRadius: '4px', textTransform: 'uppercase', marginBottom: '1rem' }}>
                {resource.category}
              </div>
              
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#231f20', marginBottom: '1.5rem', lineHeight: 1.2 }}>
                {resource.title}
              </h1>

              {/* Author Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e8e8e8', marginBottom: '1.5rem' }}>
                {resource.profiles?.avatar_url ? (
                  <img src={resource.profiles.avatar_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} color="#9b9b9b" />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#9b9b9b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shared by</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#231f20' }}>{resource.profiles?.full_name || resource.profiles?.username}</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a 
                  href={currentUserId ? resource.link : '#'} 
                  target={currentUserId ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!currentUserId) {
                      e.preventDefault();
                      router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
                    }
                  }}
                  className="get-resource-btn"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.9rem', background: '#2d43e8', color: 'white', textDecoration: 'none', fontWeight: 700, borderRadius: '6px', fontSize: '0.95rem', transition: 'background 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#333333'}
                  onMouseOut={e => e.currentTarget.style.background = '#2d43e8'}
                >
                  <Download size={18} /> Get Resource <ExternalLink size={14} style={{ opacity: 0.7 }} />
                </a>

                <button 
                  onClick={toggleSave}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%', padding: '0.9rem', background: saved ? '#231f20' : 'white', color: saved ? 'white' : '#231f20', border: saved ? '1px solid #231f20' : '1px solid #e8e8e8', fontWeight: 700, borderRadius: '6px', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.15s' }}
                >
                  <Bookmark size={18} fill={saved ? 'white' : 'none'} /> {saved ? 'Saved' : 'Save for later'}
                </button>
              </div>

              {/* Security Note */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <ShieldCheck size={16} color="#64748b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  This resource links to an external site. Desayner does not host this file and cannot guarantee its contents. Download at your own discretion.
                </p>
              </div>

            </div>

          </div>
        </div>
      </>
  );
}
