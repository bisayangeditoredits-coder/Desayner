import { create } from 'zustand';

const useFeedStore = create((set) => ({
  projects: [],
  page: 1,
  category: 'All',
  searchQuery: '',
  sort: 'trending',
  hasMore: true,
  scrollPosition: 0,
  interactions: {}, // { [projectId]: { liked: boolean, saved: boolean } }
  
  // Method to update the feed cache
  setFeedState: (newState) => set((state) => ({ ...state, ...newState })),
  
  // Method to record scroll position
  setScrollPosition: (y) => set({ scrollPosition: y }),

  // Method to update user interactions quietly
  setInteractions: (newInteractions) => set((state) => ({ 
    interactions: { ...state.interactions, ...newInteractions } 
  })),
  
  // Method to clear cache (e.g. on hard refresh or logout)
  clearCache: () => set({ projects: [], page: 1, category: 'All', searchQuery: '', sort: 'trending', hasMore: true, scrollPosition: 0, interactions: {} })
}));

export default useFeedStore;
