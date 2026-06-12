'use client';
import { useState, useEffect, useMemo} from 'react';
import { createClient } from '@/lib/supabase/client';
import UploadZone from '@/components/upload/UploadZone';
import UserAvatar from '@/components/UserAvatar';
import { Search, ShieldAlert, Plus, Check } from 'lucide-react';

export default function FeaturedAdminPage() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState(() => ({
    banner_url: '',
    featured_title: '',
    featured_description: '',
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  }));
  
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
        
      setIsAdmin(data?.is_admin === true);
      setLoading(false);
    }
    checkAdmin();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!search.trim() || search.length < 2) {
        setSearchResults([]);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('username', `%${search}%`)
        .limit(5);
      setSearchResults(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    setMessage('');
    
    try {
      const { error } = await supabase
        .from('featured_creators')
        .insert({
          user_id: selectedUser.id,
          banner_url: formData.banner_url,
          featured_title: formData.featured_title,
          featured_description: formData.featured_description,
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
          is_active: true
        });
        
      if (error) throw error;
      setMessage('Successfully set featured creator!');
      setSelectedUser(null);
      setSearch('');
    } catch (err) {
      console.error(err);
      setMessage('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Admin Panel...</div>;

  if (!isAdmin) return (
    <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
      <ShieldAlert size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Access Denied</h1>
      <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>You do not have permission to view this page.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '2rem' }}>Manage Featured Creators</h1>
      
      {/* Step 1: Select User */}
      {!selectedUser ? (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Step 1: Select Creator</h2>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9b9b9b' }} />
            <input 
              type="text" 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by username..."
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
          </div>
          
          {searchResults.length > 0 && (
            <div style={{ marginTop: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              {searchResults.map(user => (
                <div 
                  key={user.id} 
                  onClick={() => setSelectedUser(user)}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', cursor: 'pointer', borderBottom: '1px solid #e2e8f0', background: 'white' }}
                  onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseOut={e => e.currentTarget.style.background = 'white'}
                >
                  <UserAvatar src={user.avatar_url} name={user.username} size={40} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{user.full_name || user.username}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>@{user.username}</div>
                  </div>
                  <Plus size={16} style={{ marginLeft: 'auto', color: '#3b82f6' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Step 2: Configure Feature</h2>
            <button onClick={() => setSelectedUser(null)} style={{ fontSize: '0.85rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Change User</button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
            <UserAvatar src={selectedUser.avatar_url} name={selectedUser.username} size={48} />
            <div>
              <div style={{ fontWeight: 600 }}>{selectedUser.full_name || selectedUser.username}</div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>@{selectedUser.username}</div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Professional Title</label>
              <input 
                required 
                type="text" 
                value={formData.featured_title}
                onChange={e => setFormData({ ...formData, featured_title: e.target.value })}
                placeholder="e.g. 3D Character Artist & Illustrator"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Short Editorial Description</label>
              <textarea 
                rows={3}
                value={formData.featured_description}
                onChange={e => setFormData({ ...formData, featured_description: e.target.value })}
                placeholder="Write a brief editorial intro for this creator..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical' }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Start Date</label>
                <input 
                  required 
                  type="datetime-local" 
                  value={formData.start_date}
                  onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>End Date</label>
                <input 
                  required 
                  type="datetime-local" 
                  value={formData.end_date}
                  onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Hero Banner Image</label>
              <UploadZone 
                folder="banners" 
                label="" 
                value={formData.banner_url}
                onResult={(url) => setFormData({ ...formData, banner_url: url })}
                onRemove={() => setFormData({ ...formData, banner_url: '' })}
              />
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>Recommended size: 1920x600px. Used as the large background header.</p>
            </div>
            
            <button 
              type="submit" 
              disabled={submitting || !formData.banner_url}
              className="btn btn-dark"
              style={{ padding: '1rem', marginTop: '1rem', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Saving...' : 'Set as Featured Creator'}
            </button>
            
            {message && (
              <div style={{ padding: '1rem', background: message.startsWith('Error') ? '#fee2e2' : '#dcfce3', color: message.startsWith('Error') ? '#991b1b' : '#166534', borderRadius: '8px', textAlign: 'center' }}>
                {message}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
