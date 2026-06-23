import { createClient } from '@/lib/supabase/server';
import ProjectDetailClient from './ProjectDetailClient';
import { cookies } from 'next/headers';
import { optimizeImage } from '@/lib/utils';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: project } = await supabase
    .from('projects')
    .select('title, description, cover_url, profiles(full_name)')
    .eq('id', id)
    .single();
  
  if (!project) {
    return {
      title: 'Project Not Found | Desayner',
      description: 'This project could not be found.',
    };
  }

  const title = `${project.title} by ${project.profiles?.full_name || 'Creator'} | Desayner`;
  const description = project.description || `View "${project.title}" on Desayner, the ultimate design inspiration platform.`;
  
  const rawUrl = project.cover_url || 'https://desayner.com/default-og.png';
  const optimizedPath = optimizeImage(rawUrl, 1200, 80);
  const imageUrl = optimizedPath.startsWith('http') ? optimizedPath : `https://desayner.com${optimizedPath}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/projects/${id}`,
    },
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
      type: 'article',
      url: `https://desayner.com/projects/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProjectPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: project } = await supabase
    .from('projects')
    .select(`
      id, title, cover_url, thumbnail_url, images, description, tools, tags,
      likes_count, saves_count, views_count, created_at, user_id, published,
      profiles!projects_user_id_fkey(
        id, username, full_name, avatar_url,
        bio, followers_count, projects_count, website
      )
    `)
    .eq('id', id)
    .single();

  const jsonLd = project ? {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description || `A design project by ${project.profiles?.full_name || 'Creator'}`,
    image: project.cover_url || 'https://desayner.com/default-og.png',
    author: {
      '@type': 'Person',
      name: project.profiles?.full_name || 'Creator',
      url: `https://desayner.com/profile/${project.profiles?.username || ''}`
    },
    datePublished: project.created_at,
    url: `https://desayner.com/projects/${id}`
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <div style={{ background: '#f8fafc', minHeight: '100vh', paddingTop: '2rem' }}>
        <ProjectDetailClient initialProject={project} isModal={false} />
      </div>
    </>
  );
}
