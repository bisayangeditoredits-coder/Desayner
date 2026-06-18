'use client';
import { useState, useEffect, useMemo} from 'react';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import Link from 'next/link';
import { Bookmark, Folder, ArrowLeft } from 'lucide-react';
import '../../App.css';

export default function SavedPage() {
  const [savedProjects, setSavedProjects] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setCurrentUserId(user.id);

      const [savedRes, colRes] = await Promise.all([
        supabase
          .from('project_saves')
          .select('projects(*, profiles!projects_user_id_fkey(username, full_name, avatar_url))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('collections')
          .select('id, name, created_at, collection_items(projects(*, profiles!projects_user_id_fkey(username, full_name, avatar_url)))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      const projects = (savedRes.data || []).map(r => r.projects).filter(Boolean);
      setSavedProjects(projects);

      if (colRes.data) {
        const mappedCollections = colRes.data.map(c => ({
          id: c.id,
          name: c.name,
          created_at: c.created_at,
          items: (c.collection_items || []).map(ci => ci.projects).filter(Boolean),
        }));
        setCollections(mappedCollections);
      }

      setLoading(false);
    }
    load();
  }, [supabase]);

  return (
    <>
        <div className="page-content">
          <div className="page-header">
            <div>
              <h1 className="page-title">Saved</h1>
              <p style={{ fontSize: '0.85rem', color: '#9b9b9b', marginTop: '0.25rem' }}>Your bookmarked projects and collections</p>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {[...Array(3)].map((_, i) => <div key={i} className="shimmer-box" style={{ height: '140px', borderRadius: '12px' }} />)}
            </div>
          ) : savedProjects.length === 0 && collections.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', border: '1px solid #e8e8e8', background: 'white', borderRadius: '12px' }}>
              <Bookmark size={28} style={{ color: '#e0e0e0', display: 'block', margin: '0 auto 1rem' }} />
              <p style={{ color: '#9b9b9b', fontSize: '0.875rem', marginBottom: '1rem' }}>No saved projects yet.</p>
              <Link href="/" className="btn" style={{ display: 'inline-block', padding: '0.5rem 1.25rem', border: '1px solid #e8e8e8', fontSize: '0.8rem', fontWeight: 700, color: '#231f20', textDecoration: 'none' }}>
                Browse Projects
              </Link>
            </div>
          ) : selectedCollection ? (
            <div>
              <button 
                onClick={() => setSelectedCollection(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1.5rem', color: '#231f20', padding: 0 }}
              >
                <ArrowLeft size={16} /> Back to Collections
              </button>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>
                {selectedCollection === 'ALL' ? 'All Saved Items' : selectedCollection.name}
              </h2>
              
              {(() => {
                const items = selectedCollection === 'ALL' ? savedProjects : selectedCollection.items;
                if (items.length === 0) {
                  return (
                    <div style={{ padding: '4rem', textAlign: 'center', background: '#fafafa', borderRadius: '12px', border: '1px solid #e8e8e8' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>No projects in this collection.</p>
                    </div>
                  );
                }
                return (
                  <div className="projects-masonry">
                    {items.map(project => (
                      <ProjectCard key={project.id} project={project} currentUserId={currentUserId} />
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div 
                onClick={() => setSelectedCollection('ALL')}
                style={{ padding: '1.5rem', background: 'white', border: '1px solid #e8e8e8', borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#d1d1d1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
              >
                <Folder size={24} color="#231f20" />
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>All Saved Items</h3>
                  <p style={{ color: '#9b9b9b', fontSize: '0.85rem' }}>{savedProjects.length} items</p>
                </div>
              </div>
              
              {collections.map(col => (
                <div 
                  key={col.id} 
                  onClick={() => setSelectedCollection(col)}
                  style={{ padding: '1.5rem', background: 'white', border: '1px solid #e8e8e8', borderRadius: '12px', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#d1d1d1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e8e8e8'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
                >
                  <Folder size={24} color="#231f20" />
                  <div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{col.name}</h3>
                    <p style={{ color: '#9b9b9b', fontSize: '0.85rem' }}>{col.items.length} items</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </>
  );
}
