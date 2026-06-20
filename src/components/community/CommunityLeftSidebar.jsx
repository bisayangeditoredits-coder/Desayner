'use client';
import Link from 'next/link';
import { Flame, Clock, TrendingUp, Plus } from 'lucide-react';
import useProfileStore from '@/store/useProfileStore';
import styles from '@/app/(main)/community/community.module.css';

const SORTS = [
  { value: 'hot',    label: 'Hot',    icon: Flame },
  { value: 'newest', label: 'New',    icon: Clock },
  { value: 'top',    label: 'Top',    icon: TrendingUp },
];

const FLAIRS = [
  { value: 'all',      label: 'All' },
  { value: 'general',  label: 'General' },
  { value: 'question', label: 'Question' },
  { value: 'help',     label: 'Help' },
  { value: 'feedback', label: 'Feedback' },
];

export default function CommunityLeftSidebar({ sort, setSort, flair, setFlair }) {
  const user = useProfileStore((s) => s.user);

  return (
    <div className={styles.leftSidebar}>
      <div className={styles.stickyWrapper}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem 0', letterSpacing: '-0.03em' }}>
            Community
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.5rem 0', lineHeight: 1.4 }}>
            Ask questions, share work, get feedback, and help each other.
          </p>
          
          {user ? (
            <Link
              href="/community/new"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                padding: '0.6rem 1.25rem', borderRadius: '10px',
                background: '#231f20', color: 'white',
                textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700,
                transition: 'background 0.15s', width: '100%'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#2d43e8'}
              onMouseOut={(e) => e.currentTarget.style.background = '#231f20'}
            >
              <Plus size={16} strokeWidth={2.5} />
              New Post
            </Link>
          ) : (
            <Link
              href="/login?redirectTo=/community/new"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem',
                padding: '0.6rem 1.25rem', borderRadius: '10px',
                background: '#231f20', color: 'white',
                textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700,
                width: '100%'
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              New Post
            </Link>
          )}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Sort By
          </h3>
          <div className={styles.filterList} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSort(s.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none',
                  background: sort === s.value ? '#f1f5f9' : 'transparent',
                  color:      sort === s.value ? '#0f172a' : '#64748b',
                  fontSize: '0.85rem', fontWeight: sort === s.value ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => { if (sort !== s.value) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseOut={(e) => { if (sort !== s.value) e.currentTarget.style.background = 'transparent'; }}
              >
                <s.icon size={16} color={sort === s.value ? '#2d43e8' : '#94a3b8'} />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            Categories
          </h3>
          <div className={styles.filterList} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {FLAIRS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFlair(f.value)}
                style={{
                  padding: '0.5rem 0.75rem', borderRadius: '8px', border: 'none',
                  background: flair === f.value ? '#eff1ff' : 'transparent',
                  color:      flair === f.value ? '#2d43e8' : '#64748b',
                  fontSize: '0.85rem', fontWeight: flair === f.value ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => { if (flair !== f.value) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseOut={(e) => { if (flair !== f.value) e.currentTarget.style.background = 'transparent'; }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
