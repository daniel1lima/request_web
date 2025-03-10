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
import WebSocketService from '../services/websocketService';

interface RequestState {
  // State
  requests: Request[];
  acceptedRequests: Request[];
  currentEventId: string | null;
  isLoading: boolean;
  error: string | null;
  wsConnected: boolean;
  
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
  refreshRequests: () => Promise<Request[]>;
  
  // WebSocket actions
  connectToEventSocket: (eventId: string) => void;
  disconnectFromEventSocket: () => void;
  handleWebSocketMessage: (data: any) => void;
}

const useRequestStore = create<RequestState>((set, get) => ({
  // Initial state
  requests: [],
  acceptedRequests: [],
  currentEventId: null,
  isLoading: false,
  error: null,
  wsConnected: false,
  
  // Actions
  setRequests: (requests) => set({ requests }),
  
  fetchRequests: async (eventId, forceRefresh = false) => {
    const { currentEventId, requests } = get();
    
    if (!forceRefresh && currentEventId === eventId && requests.length > 0) {
      return requests;
    }
    
    set({ isLoading: false });
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
  
  fetchAcceptedRequests: async (eventId, forceRefresh = false) => {
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

  refreshRequests: async () => {
    const { currentEventId } = get();
    
    if (!currentEventId) {
      console.warn('Cannot refresh requests: No current event ID');
      return [];
    }
    
    try {
      const requests = await fetchRequestsByEventId(currentEventId);
      set({ 
        requests, 
        acceptedRequests: requests.filter((request: Request) => request.status === 'accepted'),
        isLoading: false 
      });
      return requests;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to refresh requests', isLoading: false });
      return [];
    }
  },
  
  addRequest: async (requestBody) => {
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
  
  acceptRequestById: async (requestId, accessToken) => {
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
  
  cancelRequestById: async (requestId, pi) => {
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
  
  markAsPlayed: async (requestId, accessToken) => {
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
  
  declineRequestById: async (requestId, accessToken, paymentId) => {
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
  
  // WebSocket actions implementation
  connectToEventSocket: (eventId) => {
    const wsService = WebSocketService.getInstance();
    
    wsService.connect(eventId);
    
    // Set up message handlers
    const createHandler = (data: any) => {
      if (data.request && get().currentEventId === eventId) {
        get().handleWebSocketMessage(data);
      }
    };
    
    const updateHandler = (data: any) => {
      if (data.request && get().currentEventId === eventId) {
        get().handleWebSocketMessage(data);
      }
    };
    
    const deleteHandler = (data: any) => {
      if (data.request && get().currentEventId === eventId) {
        get().handleWebSocketMessage(data);
      }
    };
    
    // Subscribe to message types
    wsService.subscribe('create', createHandler);
    wsService.subscribe('update', updateHandler);
    wsService.subscribe('delete', deleteHandler);
    
    set({ wsConnected: true });
  },
  
  disconnectFromEventSocket: () => {
    WebSocketService.getInstance().disconnect();
    set({ wsConnected: false });
  },
  
  handleWebSocketMessage: (data) => {
    const { type, request } = data;
    const { requests, acceptedRequests, setRequests } = get();
    
    switch (type) {
      case 'create':
        // Add the new request to the state WITHOUT setting isLoading
        setRequests([...requests, request]);
        break;
        
      case 'update':
        // Update an existing request WITHOUT setting isLoading
        const updatedRequests = requests.map(req => 
          req.requestId === request.requestId ? request : req
        );
        
        setRequests(updatedRequests);
        break;
        
      case 'delete':
        setRequests(requests.filter(req => req.requestId !== request.requestId));
        break;
        
      default:
        console.warn('Unknown WebSocket message type:', type);
    }
  }
}));

export default useRequestStore;