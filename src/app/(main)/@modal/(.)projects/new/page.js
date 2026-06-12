'use client';
import { useEffect } from 'react';

// When a user clicks "New Project" via a Next.js <Link> (soft navigation),
// the @modal interceptor catches /projects/new and renders this component
// in the modal slot — while the main children content stays on the old page.
//
// Fix: Immediately trigger a hard navigation (window.location.replace).
// Hard navigation bypasses Next.js client-side routing entirely, so the
// interceptor never fires and projects/new/page.js renders as a normal page.
export default function InterceptedNewProject() {
  useEffect(() => {
    window.location.replace('/projects/new');
  }, []);

  // Return null while the redirect is in-flight
  return null;
}
