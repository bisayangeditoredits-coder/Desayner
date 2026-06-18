import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

const PROFILE_SELECT =
  'id, username, full_name, avatar_url, cover_url, bio, tools, location, projects_count';

const useProfileStore = create((set, get) => ({
  user: null,
  profile: null,
  onboardingChecked: false,
  needsOnboarding: false,
  loading: true,

  async hydrate() {
    if (get().onboardingChecked) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      set({ loading: false, onboardingChecked: true, user: null, profile: null });
      return;
    }

    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('desayner_profile');
      if (cached) {
        try {
          set({ profile: JSON.parse(cached), user, loading: false });
        } catch {
          // ignore corrupt cache
        }
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', user.id)
      .single();

    const needsOnboarding = !profile?.avatar_url || !profile?.cover_url ||
      !profile?.username || !profile?.bio || !profile?.tools?.length;

    if (typeof window !== 'undefined' && profile) {
      localStorage.setItem('desayner_profile', JSON.stringify(profile));
    }

    set({
      user,
      profile: profile || null,
      needsOnboarding,
      loading: false,
      onboardingChecked: true,
    });
  },

  invalidate() {
    set({ onboardingChecked: false });
    return get().hydrate();
  },

  clear() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('desayner_profile');
    }
    set({
      user: null,
      profile: null,
      onboardingChecked: false,
      needsOnboarding: false,
      loading: false,
    });
  },
}));

export default useProfileStore;
