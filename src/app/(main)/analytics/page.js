import { redirect } from 'next/navigation';

/**
 * Analytics page has been removed.
 * Redirect anyone landing on /analytics to the projects page.
 */
export default function AnalyticsPage() {
  redirect('/projects');
}
