import { create } from 'zustand';

const useFeedStore = create((set) => ({
  projects: [],
  page: 1,
  category: 'All',
  hasMore: true,
  scrollPosition: 0,
  
  // Method to update the feed cache
  setFeedState: (newState) => set((state) => ({ ...state, ...newState })),
  
  // Method to record scroll position
  setScrollPosition: (y) => set({ scrollPosition: y }),
  
  // Method to clear cache (e.g. on hard refresh or logout)
  clearCache: () => set({ projects: [], page: 1, category: 'All', hasMore: true, scrollPosition: 0 })
}));

export default useFeedStore;
