import { create } from 'zustand';

interface UIState {
  // State
  currentView: "explore" | "events" | "user";
  searchQuery: string;
  fadeOut: boolean;
  
  // Actions
  setCurrentView: (view: "explore" | "events" | "user") => void;
  setSearchQuery: (query: string) => void;
  setFadeOut: (fadeOut: boolean) => void;
}

const useUIStore = create<UIState>((set) => ({
  // Initial state
  currentView: "explore",
  searchQuery: "",
  fadeOut: false,
  
  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFadeOut: (fadeOut) => set({ fadeOut }),
}));

export default useUIStore;