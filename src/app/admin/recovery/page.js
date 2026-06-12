'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function RecoveryPage() {
  const [loading, setLoading] = useState(true);
  const [deletedProjects, setDeletedProjects] = useState([]);
  const [deletedAssets, setDeletedAssets] = useState([]);
  const [restoring, setRestoring] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (!profile?.is_admin) {
        setLoading(false);
        return;
      }
      
      setIsAdmin(true);

      // Load soft-deleted items (we can query this if we change RLS for admins, 
      // but standard users can't see them. Since we are using standard client here,
      // it will hit RLS. If RLS blocks deleted items, we need a special API or RLS policy!)
      // Let's use an API route for fetching deleted items to bypass RLS securely.
      
      try {
        const res = await fetch('/api/admin/deleted-items');
        if (res.ok) {
          const data = await res.json();
          setDeletedProjects(data.projects || []);
          setDeletedAssets(data.assets || []);
        }
      } catch (err) {
        console.error('Failed to load deleted items:', err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [supabase]);

  async function handleRestore(table, id) {
    if (!confirm('Restore this item?')) return;
    setRestoring(true);
    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, id })
      });
      if (res.ok) {
        if (table === 'projects') {
          setDeletedProjects(prev => prev.filter(p => p.id !== id));
        } else if (table === 'assets') {
          setDeletedAssets(prev => prev.filter(a => a.id !== id));
        }
        alert('Item restored successfully.');
      } else {
        alert('Failed to restore item.');
      }
    } catch (err) {
      console.error(err);
      alert('Error restoring item.');
    } finally {
      setRestoring(false);
    }
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading Admin Recovery...</div>;
  if (!isAdmin) return <div style={{ padding: '2rem', color: 'red' }}>Access Denied: You are not an admin.</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Disaster Recovery</h1>
      <p style={{ marginBottom: '2rem', color: '#666' }}>Restore soft-deleted entities.</p>

      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Deleted Projects</h2>
        {deletedProjects.length === 0 ? (
          <p style={{ color: '#999' }}>No deleted projects.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {deletedProjects.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
                <div>
                  <h3 style={{ fontWeight: 600 }}>{p.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#999' }}>Deleted: {new Date(p.deleted_at).toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => handleRestore('projects', p.id)} 
                  disabled={restoring}
                  style={{ background: '#0a0a0a', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Deleted Assets</h2>
        {deletedAssets.length === 0 ? (
          <p style={{ color: '#999' }}>No deleted assets.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {deletedAssets.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
                <div>
                  <h3 style={{ fontWeight: 600 }}>{a.title}</h3>
                  <span style={{ fontSize: '0.8rem', color: '#999' }}>Deleted: {new Date(a.deleted_at).toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => handleRestore('assets', a.id)} 
                  disabled={restoring}
                  style={{ background: '#0a0a0a', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
