import { create } from 'zustand';

const useToastStore = create((set) => ({
  toasts: [],
  activeConversationId: null,

  // Track which conversation is currently open on screen
  setActiveConversationId: (id) => set({ activeConversationId: id }),

  // Add a toast notification to the active list
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = {
      id,
      type: 'info', // 'success' | 'error' | 'info' | 'like' | 'comment' | 'save' | 'follow' | 'message'
      duration: 4000, // auto-dismiss time in ms (0 for infinite)
      ...toast,
    };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Automatically remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        useToastStore.getState().removeToast(id);
      }, newToast.duration);
    }

    return id;
  },

  // Remove a toast by id
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Clear all toasts
  clearToasts: () => set({ toasts: [] }),
}));

export default useToastStore;
