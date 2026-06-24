import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';
import { createClient } from '@/lib/supabase/client';
import useFeedStore from '@/store/useFeedStore';

const PAGE_SIZE = 24;

export default function useProjectsFeed(initialProjects = []) {
  const { category, searchQuery, sort, scrollPosition, interactions, setFeedState, setScrollPosition, setInteractions } = useFeedStore();
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);

  const supabase = useMemo(() => createClient(), []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== searchInput) {
        setFeedState({ searchQuery: searchInput });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, setFeedState]);

  // Load User Auth
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      setIsAuthLoaded(true);
    }
    loadUser();
  }, [supabase]);

  // SWR Fetcher
  const fetcher = async ([key, cat, query, sortOpt, pageIndex, cursor]) => {
    const offset = pageIndex * PAGE_SIZE;
    let url = `/api/projects?category=${encodeURIComponent(cat)}&limit=${PAGE_SIZE}&offset=${offset}&sort=${encodeURIComponent(sortOpt)}`;
    if (query) url += `&q=${encodeURIComponent(query)}`;
    if (cursor) url += `&cursor=${encodeURIComponent(cursor)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return await res.json();
  };

  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData) {
      const prevProjects = previousPageData.projects || [];
      if (prevProjects.length < PAGE_SIZE) return null;
    }
    const cursor = previousPageData ? previousPageData.nextCursor : null;
    return ['projects_feed', category, searchQuery, sort, pageIndex, cursor];
  };

  const fallbackData = initialProjects.length > 0 && !searchQuery 
    ? [{ projects: initialProjects, nextCursor: initialProjects.length === PAGE_SIZE ? PAGE_SIZE : null }] 
    : undefined;

  const { data, size, setSize, isValidating, error, mutate } = useSWRInfinite(getKey, fetcher, {
    fallbackData,
    revalidateFirstPage: false,
    persistSize: true,
  });

  // Flatten and deduplicate
  const projects = useMemo(() => {
    if (!data) return [];
    const seen = new Set();
    return data
      .map(page => page.projects || [])
      .flat()
      .filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
  }, [data]);

  const isLoadingInitialData = !data && !error;
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.projects?.length === 0;

  const GUEST_LIMIT = 32;
  const isGuestRestricted = isAuthLoaded && !currentUserId && projects.length >= GUEST_LIMIT;
  const displayProjects = isGuestRestricted ? projects.slice(0, GUEST_LIMIT) : projects;
  const hasMore = data ? (data[data.length - 1]?.projects?.length === PAGE_SIZE) : false;

  // Background interaction hydration
  useEffect(() => {
    if (!currentUserId || !projects.length) return;

    const missingIds = projects
      .map(p => p.id)
      .filter(id => interactions[id] === undefined);

    if (missingIds.length === 0) return;

    const pending = {};
    missingIds.forEach(id => pending[id] = { liked: false, saved: false });
    setInteractions(pending);

    async function fetchInteractions() {
      const [{ data: likedList }, { data: savedList }] = await Promise.all([
        supabase.from('project_likes').select('project_id').eq('user_id', currentUserId).in('project_id', missingIds),
        supabase.from('project_saves').select('project_id').eq('user_id', currentUserId).in('project_id', missingIds)
      ]);

      const likedSet = new Set((likedList || []).map(l => l.project_id));
      const savedSet = new Set((savedList || []).map(l => l.project_id));

      const newInteractions = {};
      missingIds.forEach(id => {
        newInteractions[id] = {
          liked: likedSet.has(id),
          saved: savedSet.has(id)
        };
      });

      setInteractions(newInteractions);
    }
    fetchInteractions();
  }, [currentUserId, projects, interactions, setInteractions, supabase]);

  // Scroll Restoration
  const scrollRestoredRef = useRef(false);
  useEffect(() => {
    if (!scrollRestoredRef.current && projects.length > 0 && scrollPosition > 0) {
      scrollRestoredRef.current = true;
      window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    }
  }, [projects.length, scrollPosition]);

  useEffect(() => {
    return () => setScrollPosition(window.scrollY);
  }, [setScrollPosition]);

  // Infinite Scroll Observer
  const observerRef = useRef(null);
  const lastElementRef = useCallback((node) => {
    if (isLoadingInitialData || isLoadingMore || !hasMore || isGuestRestricted) return;
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isValidating) {
          setSize(size + 1);
        }
      },
      { rootMargin: '300px' }
    );

    if (node) observerRef.current.observe(node);
  }, [isLoadingInitialData, isLoadingMore, hasMore, isValidating, size, setSize, isGuestRestricted]);

  return {
    projects: displayProjects,
    isLoadingInitialData,
    isLoadingMore,
    isEmpty,
    hasMore,
    isGuestRestricted,
    lastElementRef,
    searchInput,
    setSearchInput,
    category,
    setFeedState,
    sort,
    interactions
  };
}
