const RETURN_KEY = 'projectModalReturnTo';

/** Call before navigating to /projects/[id] so the modal can return to the right page. */
export function saveProjectModalReturn() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(RETURN_KEY, window.location.pathname + window.location.search);
}

/** Read and clear the saved return path (fallback when opened via direct link). */
export function consumeProjectModalReturn(fallback = '/projects') {
  if (typeof window === 'undefined') return fallback;
  const path = sessionStorage.getItem(RETURN_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  return path || fallback;
}
