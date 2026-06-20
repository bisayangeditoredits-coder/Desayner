'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import useProfileStore from '@/store/useProfileStore';
import { ArrowLeft, Loader2 } from 'lucide-react';

// NewPostForm is client-only (uses file input, image processing)
const NewPostForm = dynamic(() => import('@/components/community/NewPostForm'), {
  ssr: false,
  loading: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  ),
});

export default function NewPostPage() {
  const router  = useRouter();
  const user    = useProfileStore((s) => s.user);
  const loading = useProfileStore((s) => s.loading);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?redirectTo=/community/new');
    }
  }, [user, loading, router]);

  if (loading || !user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#94a3b8' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem' }}>

      {/* Back link */}
      <Link
        href="/community"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          color: '#64748b', fontSize: '0.83rem', fontWeight: 600,
          textDecoration: 'none', marginBottom: '1.5rem',
          transition: 'color 0.15s',
        }}
        onMouseOver={(e) => e.currentTarget.style.color = '#0f172a'}
        onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
      >
        <ArrowLeft size={14} /> Back to Community
      </Link>

      {/* Card */}
      <div style={{
        background: 'white',
        border: '1px solid #e8e8e8',
        borderRadius: '16px',
        padding: '2rem',
      }}>
        <h1 style={{
          fontSize: '1.4rem', fontWeight: 900, color: '#0f172a',
          margin: '0 0 0.3rem', letterSpacing: '-0.02em',
        }}>
          Create a Post
        </h1>
        <p style={{ fontSize: '0.83rem', color: '#94a3b8', margin: '0 0 1.75rem', lineHeight: 1.4 }}>
          Share something with the Desayner community — a question, feedback request, resource, or just a discussion.
        </p>

        <NewPostForm />
      </div>
    </div>
  );
}
