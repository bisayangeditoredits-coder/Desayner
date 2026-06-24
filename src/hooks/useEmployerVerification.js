import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getEmployerVerification } from '@/lib/services/employerService';

/**
 * Custom hook to enforce employer verification before allowing access to a page.
 * Automatically redirects to /login if unauthenticated.
 * @returns {Object} { profile, checkingAuth }
 */
export function useEmployerVerification() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await getEmployerVerification();
        setProfile(data);
      } catch (err) {
        if (err.message.includes('Unauthorized')) {
          router.push('/login');
        } else {
          console.error(err);
        }
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, [router]);

  return { profile, checkingAuth };
}
