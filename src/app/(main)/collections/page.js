'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import { Folder, ChevronRight } from 'lucide-react';
import '../../App.css';

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCol, setSelectedCol] = useState(null);
  const [colProjects, setColProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data } = await supabase
        .from('collections')
        .select('*, collection_items(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      setCollections(data || []);
      setLoading(false);
    }
    load();
  }, []);

  async function loadCollectionProjects(colId) {
    setLoadingProjects(true);
    const { data } = await supabase
      .from('collection_items')
      .select('projects(*, profiles!projects_user_id_fkey(username, full_name, avatar_url))')
      .eq('collection_id', colId)
      .order('added_at', { ascending: false });
      
    setColProjects(data?.map(d => d.projects) || []);
    setLoadingProjects(false);
  }

  return (
    <>
        
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
          {/* Collections Sidebar */}
          <div style={{ width: '260px', borderRight: 'var(--border)', background: 'var(--card-bg)', padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-main)' }}>Collections</h2>
            
            {loading ? (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Loading...</div>
            ) : collections.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No collections yet. Save a project to create one.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {collections.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCol(c);
                      loadCollectionProjects(c.id);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.75rem', background: selectedCol?.id === c.id ? 'var(--secondary-bg)' : 'transparent',
                      border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left',
                      color: selectedCol?.id === c.id ? 'var(--text-main)' : 'var(--text-dim)'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                      <Folder size={14} /> {c.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.5rem', borderRadius: '10px' }}>
                      {c.collection_items[0]?.count || 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Area */}
          <div style={{ flex: 1, padding: '2rem' }}>
            {!selectedCol ? (
              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Select a collection to view saved projects
              </div>
            ) : (
              <>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1.5rem' }}>
                  {selectedCol.name}
                </h1>
                
                {loadingProjects ? (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Loading projects...</div>
                ) : colProjects.length === 0 ? (
                  <div style={{ padding: '4rem 2rem', textAlign: 'center', border: 'var(--border)', background: 'var(--card-bg)' }}>
                    <p style={{ fontWeight: 700, color: 'var(--text-main)' }}>This collection is empty.</p>
                  </div>
                ) : (
                  <div className="projects-masonry">
                    {colProjects.map(project => (
                      <ProjectCard key={project.id} project={project} currentUserId={currentUserId} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </>
  );
}
