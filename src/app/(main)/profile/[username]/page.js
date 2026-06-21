import { createClient } from '@/lib/supabase/server';
import ProfileClient from './ProfileClient';
import { cookies } from 'next/headers';
import { optimizeImage } from '@/lib/utils';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { username } = await params;
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, bio, avatar_url')
    .eq('username', username)
    .single();
  
  if (!profile) {
    return {
      title: 'Profile Not Found | Desayner',
    };
  }

  const name = profile.full_name || profile.username;
  const title = `${name} (@${profile.username}) on Desayner`;
  const description = profile.bio || `Check out ${name}'s design portfolio and projects on Desayner.`;
  
  const rawUrl = profile.avatar_url || 'https://desayner.com/default-og.png';
  const optimizedPath = optimizeImage(rawUrl, 800, 85);
  const imageUrl = optimizedPath.startsWith('http') ? optimizedPath : `https://desayner.com${optimizedPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/profile/${username}`,
    },
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
      type: 'profile',
      url: `https://desayner.com/profile/${username}`,
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProfilePage({ params }) {
  const { username } = await params;
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  const name = profile?.full_name || profile?.username || 'Designer';

  const jsonLd = profile ? {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    dateCreated: profile.created_at,
    mainEntity: {
      '@type': 'Person',
      name: name,
      alternateName: profile.username,
      description: profile.bio || `Check out ${name}'s design portfolio on Desayner.`,
      image: profile.avatar_url || 'https://desayner.com/default-avatar.png',
      url: `https://desayner.com/profile/${profile.username}`
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProfileClient initialProfile={profile} />
    </>
  );
}
