'use client';
import { useState, useEffect, useMemo} from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Plus, Library } from 'lucide-react';
import ResourceDetailModal from '@/components/ResourceDetailModal';
import '../../App.css';

const CATEGORIES = ['All', 'Templates', 'Mockups', 'Fonts', 'Icons', 'UI Kits', 'Tutorials'];

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('All');
  const [tab, setTab] = useState('Explore'); // 'Explore' | 'Saved'
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();

      if (tab === 'Saved') {
        if (!user) { setResources([]); setLoading(false); return; }
        const { data } = await supabase
          .from('resource_saves')
          .select('resources(*, profiles(full_name, username, avatar_url))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        const savedRes = data ? data.map(item => item.resources).filter(Boolean) : [];
        setResources(savedRes);
      } else {
        let query = supabase
          .from('resources')
          .select('*, profiles(full_name, username, avatar_url)')
          .order('created_at', { ascending: false });

        if (activeCat !== 'All') {
          query = query.eq('category', activeCat);
        }

        const { data } = await query;
        setResources(data || []);
      }
      setLoading(false);
    }
    load();
  }, [activeCat, tab]);

  return (
    <>
        
        <div style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Library size={24} /> Resources
              </h1>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '0.2rem' }}>Free community assets, templates, and tools.</p>
            </div>
            <Link 
              href="/resources/new"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--text-main)', color: 'var(--card-bg)', padding: '0.6rem 1rem', borderRadius: '4px', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Share Resource
            </Link>
          </div>

          {/* Top Tabs */}
          <div className="tabs" style={{ marginBottom: '2rem' }}>
            <button className={`tab-btn ${tab === 'Explore' ? 'active' : ''}`} onClick={() => setTab('Explore')}>Explore</button>
            <button className={`tab-btn ${tab === 'Saved' ? 'active' : ''}`} onClick={() => setTab('Saved')}>Saved</button>
          </div>

          {/* Categories (Only in Explore) */}
          {tab === 'Explore' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  style={{
                    padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid var(--border)',
                    background: activeCat === cat ? 'var(--text-main)' : 'var(--card-bg)',
                    color: activeCat === cat ? 'var(--card-bg)' : 'var(--text-main)',
                    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ color: 'var(--text-dim)' }}>Loading resources...</div>
          ) : resources.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', maxWidth: '640px', margin: '2rem auto' }}>
              <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Library size={28} style={{ color: '#9ca3af' }} />
              </div>
              <p style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.5rem', color: '#111827', letterSpacing: '-0.02em' }}>
                {tab === 'Saved' ? 'No saved resources yet' : 'No resources found'}
              </p>
              <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' }}>
                {tab === 'Saved' 
                  ? 'Resources you save will appear here for easy access later.' 
                  : 'Be the first to share a resource in this category and help the community!'}
              </p>
              {tab === 'Saved' && (
                <button
                  onClick={() => setTab('Explore')}
                  style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Explore Resources
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {resources.map(res => (
                <button
                  key={res.id}
                  onClick={() => setSelectedResourceId(res.id)}
                  style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', background: 'var(--card-bg)', border: 'var(--border)', borderRadius: '6px', overflow: 'hidden', textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s', cursor: 'pointer', ':hover': { transform: 'translateY(-2px)' } }}
                >
                  <div style={{ aspectRatio: '16/9', width: '100%', background: 'var(--secondary-bg)', position: 'relative' }}>
                    {res.thumbnail_url ? (
                      <img src={res.thumbnail_url} alt={res.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Library size={32} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0009fa', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{res.category}</div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{res.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{res.description}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: 'var(--border)', paddingTop: '0.8rem' }}>
                      {res.profiles?.avatar_url ? (
                        <img src={res.profiles.avatar_url} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--secondary-bg)' }} />
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Shared by {res.profiles?.username || 'Unknown'}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

        </div>
        
        {/* Render the modal if a resource is selected */}
        {selectedResourceId && (
          <ResourceDetailModal 
            resourceId={selectedResourceId} 
            onClose={() => setSelectedResourceId(null)} 
          />
        )}
      </>
  );
}
