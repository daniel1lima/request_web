import { 
  fetchRequestsByEventId, 
  createRequest, 
  acceptRequest, 
  cancelRequest, 
  markRequestAsPlayed,
  declineRequest,
  RequestBody,
  RequestStatus,
  updateRequestStatus
} from '../api/apiService';
import { Request } from '../app/event/page';
import WebSocketService from '../services/websocketService';
import { create } from "zustand";

// Define a class for the request store
export class RequestStore {
  // State
  private _requests: Request[] = [];
  private _acceptedRequests: Request[] = [];
  private _currentEventId: string | null = null;
  private _isLoading: boolean = false;
  private _error: string | null = null;
  private _wsConnected: boolean = false;
  private _listeners: Array<() => void> = [];
  
  // Getters
  get requests() { return this._requests; }
  get acceptedRequests() { return this._acceptedRequests; }
  get currentEventId() { return this._currentEventId; }
  get isLoading() { return this._isLoading; }
  get error() { return this._error; }
  get wsConnected() { return this._wsConnected; }
  
  // Subscribe to state changes
  subscribe(listener: () => void) {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }
  
  // Notify listeners of state changes
  private notifyListeners() {
    this._listeners.forEach(listener => listener());
  }
  
  // Update state
  private setState(newState: Partial<{
    requests: Request[];
    acceptedRequests: Request[];
    currentEventId: string | null;
    isLoading: boolean;
    error: string | null;
    wsConnected: boolean;
  }>) {
    if (newState.requests !== undefined) this._requests = newState.requests;
    if (newState.acceptedRequests !== undefined) this._acceptedRequests = newState.acceptedRequests;
    if (newState.currentEventId !== undefined) this._currentEventId = newState.currentEventId;
    if (newState.isLoading !== undefined) this._isLoading = newState.isLoading;
    if (newState.error !== undefined) this._error = newState.error;
    if (newState.wsConnected !== undefined) this._wsConnected = newState.wsConnected;
    
    this.notifyListeners();
  }
  
  // Actions
  setRequests(requests: Request[]) {
    this.setState({ requests });
  }
  
  async fetchRequests(eventId: string, forceRefresh = false): Promise<Request[]> {
    if (!forceRefresh && this._currentEventId === eventId && this._requests.length > 0) {
      return this._requests;
    }
    
    this.setState({ isLoading: true });
    try {
      const requests = await fetchRequestsByEventId(eventId);
      this.setState({ 
        requests, 
        acceptedRequests: requests.filter((request: Request) => request.status === 'accepted'),
        currentEventId: eventId,
        isLoading: false 
      });
      return requests;
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to fetch requests', 
        isLoading: false 
      });
      return [];
    }
  }
  
  async fetchAcceptedRequests(eventId: string, forceRefresh = false): Promise<Request[]> {
    if (!forceRefresh && this._currentEventId === eventId && this._requests.length > 0) {
      return this._acceptedRequests;
    }
    
    this.setState({ isLoading: true });
    try {
      const requests = await fetchRequestsByEventId(eventId);
      const acceptedRequests = requests.filter((request: Request) => request.status === 'accepted');
      
      this.setState({ 
        requests,
        acceptedRequests,
        currentEventId: eventId,
        isLoading: false 
      });
      
      return acceptedRequests;
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to fetch accepted requests', 
        isLoading: false 
      });
      return [];
    }
  }

  async refreshRequests(): Promise<Request[]> {
    if (!this._currentEventId) {
      console.warn('Cannot refresh requests: No current event ID');
      return [];
    }
    
    try {
      const requests = await fetchRequestsByEventId(this._currentEventId);
      this.setState({ 
        requests, 
        acceptedRequests: requests.filter((request: Request) => request.status === 'accepted'),
        isLoading: false 
      });
      return requests;
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to refresh requests', 
        isLoading: false 
      });
      return [];
    }
  }
  
  async addRequest(requestBody: RequestBody): Promise<void> {
    this.setState({ isLoading: true });
    try {
      const newRequest = await createRequest(requestBody);
      const updatedRequests = [...this._requests, newRequest];
      this.setState({ 
        requests: updatedRequests,
        acceptedRequests: newRequest.status === 'accepted' 
          ? [...this._acceptedRequests, newRequest]
          : this._acceptedRequests,
        isLoading: false 
      });
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to create request', 
        isLoading: false 
      });
    }
  }
  
  async acceptRequestById(requestId: string, accessToken: string): Promise<void> {
    this.setState({ isLoading: true });
    try {
      await acceptRequest(requestId, accessToken);
      
      const updatedRequests = this._requests.map(request => 
        request.requestId === requestId 
          ? { ...request, accepted: true, status: 'ACCEPTED' } 
          : request
      );
      
      const acceptedRequest = updatedRequests.find(r => r.requestId === requestId);
      
      const updatedAcceptedRequests = acceptedRequest 
        ? [...this._acceptedRequests.filter(r => r.requestId !== requestId), acceptedRequest]
        : this._acceptedRequests;
        
      this.setState({
        requests: updatedRequests,
        acceptedRequests: updatedAcceptedRequests,
        isLoading: false
      });
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to accept request', 
        isLoading: false 
      });
    }
  }
  
  async cancelRequestById(requestId: string, pi: string): Promise<void> {
    this.setState({ isLoading: true });
    try {
      await cancelRequest(requestId, pi);
      this.setState({
        requests: this._requests.map(request => 
          request.requestId === requestId 
            ? { ...request, status: 'CANCELLED' } 
            : request
        ),
        acceptedRequests: this._acceptedRequests.filter(
          request => request.requestId !== requestId
        ),
        isLoading: false
      });
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to cancel request', 
        isLoading: false 
      });
    }
  }
  
  async markAsPlayed(requestId: string, accessToken: string): Promise<void> {
    this.setState({ isLoading: true });
    try {
      await markRequestAsPlayed(requestId, accessToken);
      this.setState({
        requests: this._requests.map(request => 
          request.requestId === requestId 
            ? { ...request, played: true, status: 'PLAYED' } 
            : request
        ),
        isLoading: false
      });
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to mark request as played', 
        isLoading: false 
      });
    }
  }
  
  async declineRequestById(requestId: string, accessToken: string, paymentId: string): Promise<void> {
    this.setState({ isLoading: true });
    try {
      await declineRequest(requestId, accessToken, paymentId);
      this.setState({
        requests: this._requests.map(request => 
          request.requestId === requestId 
            ? { ...request, accepted: false, status: 'DECLINED' } 
            : request
        ),
        isLoading: false
      });
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to decline request', 
        isLoading: false 
      });
    }
  }
  
  clearError(): void {
    this.setState({ error: null });
  }
  
  // WebSocket actions implementation
  connectToEventSocket(eventId: string): void {
    const wsService = WebSocketService.getInstance();
    
    wsService.connect(eventId);
    
    // Set up message handlers
    const createHandler = (data: any) => {
      if (data.request && this._currentEventId === eventId) {
        this.handleWebSocketMessage(data);
      }
    };
    
    const updateHandler = (data: any) => {
      if (data.request && this._currentEventId === eventId) {
        this.handleWebSocketMessage(data);
      }
    };
    
    const deleteHandler = (data: any) => {
      if (data.request && this._currentEventId === eventId) {
        this.handleWebSocketMessage(data);
      }
    };
    
    // Subscribe to message types
    wsService.subscribe('create', createHandler);
    wsService.subscribe('update', updateHandler);
    wsService.subscribe('delete', deleteHandler);
    
    this.setState({ wsConnected: true });
  }
  
  disconnectFromEventSocket(): void {
    WebSocketService.getInstance().disconnect();
    this.setState({ wsConnected: false });
  }
  
  handleWebSocketMessage(data: any): void {
    const { type, request } = data;
    
    switch (type) {
      case 'create':
        // Add the new request to the state WITHOUT setting isLoading
        this.setRequests([...this._requests, request]);
        break;
        
      case 'update':
        // Update an existing request WITHOUT setting isLoading
        const updatedRequests = this._requests.map(req => 
          req.requestId === request.requestId ? request : req
        );
        
        this.setRequests(updatedRequests);
        break;
        
      case 'delete':
        this.setRequests(this._requests.filter(req => req.requestId !== request.requestId));
        break;
        
      default:
        console.warn('Unknown WebSocket message type:', type);
    }
  }

  constructor() {
    // Register this store with the WebSocketService
    const wsService = WebSocketService.getInstance();
    wsService.registerStoreCallback("requestStore", this.handleWebSocketUpdate.bind(this));
  }

  // Method to handle WebSocket updates
  handleWebSocketUpdate(data: any): void {
    console.log("RequestStore received WebSocket update:", data);
    
    // Handle different types of updates
    if (data.type === "new_request" || data.type === "request_update") {
      const eventId = localStorage.getItem("eventId");
      if (eventId) {
        this.fetchRequests(eventId, true);
      }
    }
  }

  // Make sure to clean up when the store is destroyed
  cleanup(): void {
    const wsService = WebSocketService.getInstance();
    wsService.unregisterStoreCallback("requestStore");
  }
}

// Create a hook to use the store in React components
import { useState, useEffect } from 'react';

// Create the store instance
const requestStore = new RequestStore();

// Export the hook that components will use
export const useRequestStore = () => {
  // Force re-render when store changes
  const [, setForceUpdate] = useState({});
  
  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = requestStore.subscribe(() => {
      setForceUpdate({});
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);
  
  return requestStore;
}