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
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDj: (djId: string) => Promise<void>;
  clearError: () => void;
}

const useDjStore = create<DJState>((set) => ({
  // Initial state
  currentDj: null,
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
  
  clearError: () => set({ error: null }),
}));

export default useDjStore;