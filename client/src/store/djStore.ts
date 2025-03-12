import { create } from 'zustand';
import { fetchDjById } from '../api/apiService';


export interface DJ {
    djId: string;
    djName: string;
    djInsta?: string;
    djImageUrl: string;
  }

interface DJState {
  // State
  currentDj: DJ | null;
  activeDj: DJ | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDj: (djId: string) => Promise<void>;
  fetchActiveDj: (djId: string) => Promise<void>;
  clearError: () => void;
  setActiveDj: (dj: DJ | null) => void;
}

const useDjStore = create<DJState>((set) => ({
  // Initial state
  currentDj: null,
  activeDj: null,
  isLoading: false,
  error: null,
  
  // Actions
  fetchDj: async (djId: string) => {
    set({ isLoading: true });
    try {
      const dj = await fetchDjById(djId);
      set({ currentDj: dj, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch DJ', isLoading: false });
    }
  },
  
  fetchActiveDj: async (djId: string) => {
    set({ isLoading: true });
    try {
      const dj = await fetchDjById(djId);
      set({ activeDj: dj, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch active DJ', isLoading: false });
    }
  },
  
  setActiveDj: (dj) => set({ activeDj: dj }),
  
  clearError: () => set({ error: null }),
}));

export default useDjStore;