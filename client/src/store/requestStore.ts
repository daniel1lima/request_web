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
  acceptedRequests: Request[];
  currentEventId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setRequests: (requests: Request[]) => void;
  fetchRequests: (eventId: string, forceRefresh?: boolean) => Promise<Request[]>;
  fetchAcceptedRequests: (eventId: string, forceRefresh?: boolean) => Promise<Request[]>;
  addRequest: (requestBody: RequestBody) => Promise<void>;
  acceptRequestById: (requestId: string, accessToken: string) => Promise<void>;
  cancelRequestById: (requestId: string, pi: string) => Promise<void>;
  markAsPlayed: (requestId: string, accessToken: string) => Promise<void>;
  declineRequestById: (requestId: string, accessToken: string, paymentId: string) => Promise<void>;
  clearError: () => void;
}

const useRequestStore = create<RequestState>()((set, get) => ({
  // Initial state
  requests: [],
  acceptedRequests: [],
  currentEventId: null,
  isLoading: false,
  error: null,
  
  // Actions
  setRequests: (requests: Request[]) => set({ requests }),
  
  fetchRequests: async (eventId: string, forceRefresh: boolean = false): Promise<Request[]> => {
    const { currentEventId, requests } = get();
    
    if (!forceRefresh && currentEventId === eventId && requests.length > 0) {
      return requests;
    }
    
    set({ isLoading: true });
    try {
      const requests = await fetchRequestsByEventId(eventId);
      set({ 
        requests, 
        acceptedRequests: requests.filter((request: Request) => request.status === 'accepted'),
        currentEventId: eventId,
        isLoading: false 
      });
      return requests;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch requests', isLoading: false });
      return [];
    }
  },
  
  fetchAcceptedRequests: async (eventId: string, forceRefresh: boolean = false): Promise<Request[]> => {
    const { currentEventId, requests, acceptedRequests } = get();
    
    if (!forceRefresh && currentEventId === eventId && requests.length > 0) {
      return acceptedRequests;
    }
    
    set({ isLoading: true });
    try {
      const requests = await fetchRequestsByEventId(eventId);
      const acceptedRequests = requests.filter((request: Request) => request.status === 'accepted');
      
      set({ 
        requests,
        acceptedRequests,
        currentEventId: eventId,
        isLoading: false 
      });
      
      return acceptedRequests;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch accepted requests', isLoading: false });
      return [];
    }
  },
  
  addRequest: async (requestBody: RequestBody) => {
    set({ isLoading: true });
    try {
      const newRequest = await createRequest(requestBody);
      set((state) => {
        const updatedRequests = [...state.requests, newRequest];
        return { 
          requests: updatedRequests,
          acceptedRequests: newRequest.status === 'accepted' 
            ? [...state.acceptedRequests, newRequest]
            : state.acceptedRequests,
          currentEventId: state.currentEventId,
          isLoading: false 
        };
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create request', isLoading: false });
    }
  },
  
  acceptRequestById: async (requestId: string, accessToken: string) => {
    set({ isLoading: true });
    try {
      await acceptRequest(requestId, accessToken);
      set((state) => {
        const updatedRequests = state.requests.map(request => 
          request.requestId === requestId 
            ? { ...request, accepted: true, status: 'ACCEPTED' } 
            : request
        );
        
        const acceptedRequest = updatedRequests.find(r => r.requestId === requestId);
        
        const updatedAcceptedRequests = acceptedRequest 
          ? [...state.acceptedRequests.filter(r => r.requestId !== requestId), acceptedRequest]
          : state.acceptedRequests;
          
        return {
          requests: updatedRequests,
          acceptedRequests: updatedAcceptedRequests,
          currentEventId: state.currentEventId,
          isLoading: false
        };
      });
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
        acceptedRequests: state.acceptedRequests.filter(
          request => request.requestId !== requestId
        ),
        currentEventId: state.currentEventId,
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
        currentEventId: state.currentEventId,
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
        currentEventId: state.currentEventId,
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to decline request', isLoading: false });
    }
  },
  
  clearError: () => set({ error: null }),
}));

export default useRequestStore;