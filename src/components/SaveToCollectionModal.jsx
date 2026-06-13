'use client';
import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Folder, Check } from 'lucide-react';
import Modal from './Modal';

export default function SaveToCollectionModal({ itemType = 'project', itemId, onClose }) {
  const [collections, setCollections] = useState([]);
  const [newColName, setNewColName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedTo, setSavedTo] = useState({});
  const [error, setError] = useState('');
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: cols, error } = await supabase
        .from('collections')
        .select('*, collection_items(project_id, asset_id, inspiration_id)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching collections:', error);
        setError('Failed to load collections. Please try again.');
      }

        const parsedCols = (cols || []).map(c => {
          const idColumn = itemType === 'resource' ? 'asset_id' : itemType === 'inspiration' ? 'inspiration_id' : 'project_id';
          return {
            ...c,
            hasItem: c.collection_items.some(ci => ci[idColumn] === itemId)
          };
        });
      setCollections(parsedCols);

      const savedMap = {};
      parsedCols.forEach(c => { if (c.hasItem) savedMap[c.id] = true; });
      setSavedTo(savedMap);
      setLoading(false);
    }
    load();
  }, [itemId, itemType]);

  async function createCollection(e) {
    e.preventDefault();
    if (!newColName.trim() || saving) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('collections')
      .insert({ user_id: user.id, name: newColName.trim() })
      .select()
      .single();

    if (error) {
      setError('Could not create collection. Please try again.');
    } else if (data) {
      setCollections(prev => [{ ...data, hasItem: false }, ...prev]);
      setNewColName('');
    }
    setSaving(false);
  }

  async function toggleCollection(colId) {
    const isSaved = savedTo[colId];
    setSavedTo(p => ({ ...p, [colId]: !isSaved }));
    
    const idColumn = itemType === 'resource' ? 'asset_id' : itemType === 'inspiration' ? 'inspiration_id' : 'project_id';
    
    if (isSaved) {
      await supabase.from('collection_items').delete().match({ collection_id: colId, [idColumn]: itemId });
    } else {
      await supabase.from('collection_items').insert({ collection_id: colId, [idColumn]: itemId });
      
      // Also sync to global saves table to trigger the saves_count increment
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const savesTable = itemType === 'resource' ? 'asset_saves' : itemType === 'inspiration' ? 'inspiration_saves' : 'project_saves';
        const saveIdColumn = itemType === 'resource' ? 'asset_id' : itemType === 'inspiration' ? 'inspiration_id' : 'project_id';
        
        // Upsert to handle if it's already saved globally
        await supabase.from(savesTable).upsert(
          { user_id: user.id, [saveIdColumn]: itemId },
          { onConflict: `user_id, ${saveIdColumn}` }
        );
      }
    }
  }

  const footer = (
    <form onSubmit={createCollection} style={{ display: 'flex', gap: '0.5rem' }}>
      <input
        type="text"
        value={newColName}
        onChange={e => setNewColName(e.target.value)}
        placeholder="New collection name…"
        className="input"
        style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem 0.75rem' }}
      />
      <button
        type="submit"
        disabled={!newColName.trim() || saving}
        className="btn btn-primary"
        style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
      >
        Create
      </button>
    </form>
  );

  return (
    <Modal title="Save to Collection" size="sm" onClose={onClose} footer={footer}>
      <div style={{ padding: 'var(--space-md, 1.25rem)', maxHeight: '320px', overflowY: 'auto' }}>
        {loading ? (
          <p style={{ color: 'var(--text-dim)', textAlign: 'center', fontSize: '0.85rem', margin: 0 }}>
            Loading collections…
          </p>
        ) : error ? (
          <p style={{ color: '#ef4444', textAlign: 'center', fontSize: '0.85rem', margin: 0 }}>
            {error}
          </p>
        ) : collections.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem', margin: 0 }}>
            No collections yet. Create one below.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {collections.map(c => (
              <button
                key={c.id}
                onClick={() => toggleCollection(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem', background: savedTo[c.id] ? '#f0f9ff' : '#fafafa',
                  border: `1px solid ${savedTo[c.id] ? '#bae6fd' : '#e2e8f0'}`,
                  cursor: 'pointer', textAlign: 'left', color: 'var(--text-main)',
                  transition: 'background 0.15s, border-color 0.15s',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
                  <Folder size={14} color={savedTo[c.id] ? '#2d43e8' : 'var(--text-dim)'} />
                  {c.name}
                </span>
                {savedTo[c.id]
                  ? <Check size={14} color="#1a8a3b" />
                  : <Plus size={14} color="var(--text-dim)" />
                }
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
