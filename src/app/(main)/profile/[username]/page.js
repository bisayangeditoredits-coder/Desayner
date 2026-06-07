import { createClient } from '@/lib/supabase/server';
import ProfileClient from './ProfileClient';
import { cookies } from 'next/headers';

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
  const imageUrl = profile.avatar_url || 'https://desayner.com/default-og.png';

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
  return <ProfileClient />;
}
