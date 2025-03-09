import { create } from 'zustand';
import { 
  fetchRequestsByEventId, 
  createRequest, 
  acceptRequest, 
  cancelRequest, 
  markRequestAsPlayed,
  declineRequest,
  RequestBody,
  RequestStatus
} from '../api/apiService';
import { Request } from '../app/event/page';

interface RequestState {
  // State
  requests: Request[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRequests: (eventId: string) => Promise<void>;
  addRequest: (requestBody: RequestBody) => Promise<void>;
  acceptRequestById: (requestId: string, accessToken: string) => Promise<void>;
  cancelRequestById: (requestId: string, pi: string) => Promise<void>;
  markAsPlayed: (requestId: string, accessToken: string) => Promise<void>;
  declineRequestById: (requestId: string, accessToken: string, paymentId: string) => Promise<void>;
  clearError: () => void;
}

const useRequestStore = create<RequestState>((set) => ({
  // Initial state
  requests: [],
  isLoading: false,
  error: null,
  
  // Actions
  fetchRequests: async (eventId: string) => {
    set({ isLoading: true });
    try {
      const requests = await fetchRequestsByEventId(eventId);
      set({ requests, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch requests', isLoading: false });
    }
  },
  
  addRequest: async (requestBody: RequestBody) => {
    set({ isLoading: true });
    try {
      const newRequest = await createRequest(requestBody);
      set((state) => ({ 
        requests: [...state.requests, newRequest],
        isLoading: false 
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create request', isLoading: false });
    }
  },
  
  acceptRequestById: async (requestId: string, accessToken: string) => {
    set({ isLoading: true });
    try {
      await acceptRequest(requestId, accessToken);
      set((state) => ({
        requests: state.requests.map(request => 
          request.requestId === requestId 
            ? { ...request, accepted: true, status: 'ACCEPTED' } 
            : request
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to accept request', isLoading: false });
    }
  },
  
  cancelRequestById: async (requestId: string, pi: string) => {
    set({ isLoading: true });
    try {
      await cancelRequest(requestId, pi);
      set((state) => ({
        requests: state.requests.map(request => 
          request.requestId === requestId 
            ? { ...request, status: 'CANCELLED' } 
            : request
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to cancel request', isLoading: false });
    }
  },
  
  markAsPlayed: async (requestId: string, accessToken: string) => {
    set({ isLoading: true });
    try {
      await markRequestAsPlayed(requestId, accessToken);
      set((state) => ({
        requests: state.requests.map(request => 
          request.requestId === requestId 
            ? { ...request, played: true, status: 'PLAYED' } 
            : request
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to mark request as played', isLoading: false });
    }
  },
  
  declineRequestById: async (requestId: string, accessToken: string, paymentId: string) => {
    set({ isLoading: true });
    try {
      await declineRequest(requestId, accessToken, paymentId);
      set((state) => ({
        requests: state.requests.map(request => 
          request.requestId === requestId 
            ? { ...request, accepted: false, status: 'DECLINED' } 
            : request
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to decline request', isLoading: false });
    }
  },
  
  clearError: () => set({ error: null }),
}));

export default useRequestStore;