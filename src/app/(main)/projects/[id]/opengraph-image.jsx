import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

export const alt = 'Desayner Project';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }) {
  const { id } = await params;
  
  // Create Supabase client
  const supabase = await createClient();
  
  const { data: project } = await supabase
    .from('projects')
    .select('title, cover_url, profiles!projects_user_id_fkey(full_name, avatar_url)')
    .eq('id', id)
    .single();

  if (!project) {
    return new ImageResponse(
      (
        <div style={{ background: '#0f172a', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ color: 'white', fontSize: 60, fontFamily: 'sans-serif' }}>Project Not Found</h1>
        </div>
      ), { ...size }
    );
  }

  const title = project.title || 'Untitled Project';
  const authorName = project.profiles?.full_name || 'Desayner Creator';
  const coverUrl = project.cover_url || 'https://desayner.com/default-og.png';
  let avatarUrl = project.profiles?.avatar_url || 'https://desayner.com/default-avatar.png';

  // Fallback for avatar if it's a generic UI avatar
  if (avatarUrl.includes('ui-avatars.com') || avatarUrl === '/default-avatar.png') {
    // Generate a simple colored circle or just use a default image that won't break ImageResponse
    // For ImageResponse, it's safer to just provide a valid URL.
    avatarUrl = 'https://desayner.com/default-avatar.png'; 
  }

  // Ensure absolute URLs (ImageResponse requires absolute URLs for images)
  const absoluteCover = coverUrl.startsWith('http') ? coverUrl : `https://desayner.com${coverUrl}`;
  const absoluteAvatar = avatarUrl.startsWith('http') ? avatarUrl : `https://desayner.com${avatarUrl}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#020617', // Slate 950
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        {/* Left Side: Art */}
        <div style={{ display: 'flex', width: '60%', height: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={absoluteCover} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            alt="Cover" 
          />
        </div>
        
        {/* Right Side: Info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '40%',
            height: '100%',
            padding: '60px',
            backgroundColor: '#0f172a',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Title */}
            <h1
              style={{
                fontSize: 56,
                fontWeight: 800,
                lineHeight: 1.1,
                margin: 0,
                color: '#ffffff',
                maxHeight: '190px',
                overflow: 'hidden',
              }}
            >
              {title}
            </h1>

            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={absoluteAvatar}
                style={{ width: '64px', height: '64px', borderRadius: '32px', marginRight: '20px', objectFit: 'cover' }}
                alt="Avatar"
              />
              <span style={{ fontSize: 32, fontWeight: 500, color: '#94a3b8' }}>
                {authorName}
              </span>
            </div>
          </div>

          {/* Logo / Brand */}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 'auto' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#2d43e8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
              <span style={{ color: 'white', fontSize: 28, fontWeight: 900 }}>D</span>
            </div>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: '#ffffff' }}>
              Desayner
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
