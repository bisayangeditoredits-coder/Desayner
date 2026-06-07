import { createClient } from '@/lib/supabase/server';
import ProjectDetailClient from './ProjectDetailClient';
import { cookies } from 'next/headers';

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
  const imageUrl = project.cover_url || 'https://desayner.com/default-og.png';

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
  return <ProjectDetailClient />;
}
