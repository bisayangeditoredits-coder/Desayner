import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function generateMetadata({ params }) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const { data: project } = await supabase
    .from('projects')
    .select('title, description, cover_url, profiles!projects_user_id_fkey(full_name, username)')
    .eq('id', id)
    .single();

  if (!project) return { title: 'Project Not Found | Desayner' };

  const authorName = project.profiles?.full_name || project.profiles?.username || 'Desayner Creator';
  const desc = project.description ? (project.description.slice(0, 150) + '...') : `View ${project.title} by ${authorName} on Desayner.`;

  return {
    title: `${project.title} by ${authorName} | Desayner`,
    description: desc,
    openGraph: {
      title: project.title,
      description: desc,
      images: project.cover_url ? [{ url: project.cover_url }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: project.title,
      description: desc,
      images: project.cover_url ? [project.cover_url] : [],
    },
  };
}

export default function ProjectLayout({ children }) {
  return <>{children}</>;
}
