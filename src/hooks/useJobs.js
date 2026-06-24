import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import useSWRInfinite from 'swr/infinite';

const PAGE_SIZE = 24;

export function useJobs(initialJobs = []) {
  const [selectedJob, setSelectedJob] = useState(initialJobs[0] || null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetcher = async ([url]) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return await res.json();
  };

  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.nextCursor) return null;
    const offset = previousPageData ? previousPageData.nextCursor : 0;
    
    let url = `/api/jobs?limit=${PAGE_SIZE}&offset=${offset}`;
    if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;
    
    return [url];
  };

  const fallbackData = initialJobs.length > 0 && !searchQuery 
    ? [{ jobs: initialJobs, nextCursor: initialJobs.length === PAGE_SIZE ? PAGE_SIZE : null }] 
    : undefined;

  const { data, error, size, setSize, isValidating } = useSWRInfinite(getKey, fetcher, {
    fallbackData,
    revalidateFirstPage: false,
    persistSize: true,
  });

  const jobs = useMemo(() => {
    if (!data) return [];
    const seen = new Set();
    return data
      .map(page => page.jobs || [])
      .flat()
      .filter((j) => {
        if (seen.has(j.id)) return false;
        seen.add(j.id);
        return true;
      });
  }, [data]);

  const isLoadingInitialData = !data && !error;
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === "undefined");
  const hasMore = data ? !!data[data.length - 1]?.nextCursor : false;

  const observerRef = useRef(null);
  const lastElementRef = useCallback((node) => {
    if (isLoadingInitialData || isLoadingMore || !hasMore) return;
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
  }, [isLoadingInitialData, isLoadingMore, hasMore, isValidating, size, setSize]);

  // Auto-select first job if none selected
  useEffect(() => {
    if (jobs.length > 0 && !selectedJob) {
      setSelectedJob(jobs[0]);
    }
  }, [jobs, selectedJob]);

  return {
    jobs,
    loading: isLoadingInitialData,
    isLoadingMore,
    hasMore,
    error,
    selectedJob,
    setSelectedJob,
    searchQuery,
    setSearchQuery,
    lastElementRef
  };
}
