'use client';
import { useState, useEffect, useMemo} from 'react';
import { createClient } from '@/lib/supabase/client';
import ProjectCard from '@/components/ProjectCard';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import '../../App.css';

export default function SavedPage() {
  const [savedProjects, setSavedProjects] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setCurrentUserId(user.id);

      const { data } = await supabase
        .from('project_saves')
        .select('projects(*, profiles!projects_user_id_fkey(username, full_name, avatar_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setSavedProjects((data || []).map(r => r.projects).filter(Boolean));
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
              <p style={{ fontSize: '0.85rem', color: '#9b9b9b', marginTop: '0.25rem' }}>Your bookmarked projects</p>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: '#e8e8e8', border: '1px solid #e8e8e8' }}>
              {[...Array(6)].map((_, i) => <div key={i} style={{ background: '#f5f5f5', aspectRatio: '4/3' }} />)}
            </div>
          ) : savedProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', border: '1px solid #e8e8e8', background: 'white' }}>
              <Bookmark size={28} style={{ color: '#e0e0e0', display: 'block', margin: '0 auto 1rem' }} />
              <p style={{ color: '#9b9b9b', fontSize: '0.875rem', marginBottom: '1rem' }}>No saved projects yet.</p>
              <Link href="/" style={{ display: 'inline-block', padding: '0.5rem 1.25rem', border: '1px solid #e8e8e8', fontSize: '0.8rem', fontWeight: 700, color: '#231f20' }}>
                Browse Projects
              </Link>
            </div>
          ) : (
            <div className="projects-masonry">
              {savedProjects.map(project => (
                <ProjectCard key={project.id} project={project} currentUserId={currentUserId} />
              ))}
            </div>
          )}
        </div>
    </>
  );
}
