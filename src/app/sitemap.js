import { createClient } from '@/lib/supabase/server';

export default async function sitemap() {
  const baseUrl = 'https://desayner.com';
  const supabase = await createClient();

  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/asset-store`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  // Fetch top projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(500);

  const projectRoutes = (projects || []).map((project) => ({
    url: `${baseUrl}/projects/${project.id}`,
    lastModified: new Date(project.created_at || new Date()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, created_at')
    .limit(500);

  const profileRoutes = (profiles || []).map((profile) => ({
    url: `${baseUrl}/profile/${profile.username}`,
    lastModified: new Date(profile.created_at || new Date()),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...routes, ...projectRoutes, ...profileRoutes];
}
