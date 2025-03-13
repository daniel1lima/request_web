import {
  acceptRequest,
  capturePaymentIntent,
  declineRequest as declineRequestAPI,
  deleteEvent,
  fetchDjById,
  fetchEventById,
  fetchPaymentById,
  markRequestAsPlayed,
  updateEvent,
  uploadFileApi,
} from '@/api/apiService';
import { Request, DJ } from '@/app/event-admin/page';
import WebSocketService from '@/services/websocketService';

interface AdminSettings {
  requestFee: number;
  eventImage: string;
  eventName: string;
  acceptRequests: boolean;
  freeRequests: boolean;
  freeEmailRequests: boolean;
}

export class AdminStore {
  // State
  private _djData: DJ | null = null;
  private _currentEvent: Event | null = null;
  private _eventTitle: string = "";
  private _eventImage: string = "";
  private _settings: AdminSettings = {
    eventName: "",
    requestFee: 0,
    eventImage: "",
    acceptRequests: false,
    freeRequests: false,
    freeEmailRequests: false,
  };
  private _sliderValue: number[] = [99];
  private _selectedFile: File | null = null;
  private _imagePreview: string | null = null;
  private _loadingStates: Record<string, boolean> = {};
  private _isAuthorized: boolean = false;
  private _loading: boolean = true;
  private _error: string | null = null;
  private _wsConnected: boolean = false;
  private _listeners: Array<() => void> = [];
  
  // Getters
  get djData() { return this._djData; }
  get currentEvent() { return this._currentEvent; }
  get eventTitle() { return this._eventTitle; }
  get eventImage() { return this._eventImage; }
  get settings() { return this._settings; }
  get sliderValue() { return this._sliderValue; }
  get selectedFile() { return this._selectedFile; }
  get imagePreview() { return this._imagePreview; }
  get loadingStates() { return this._loadingStates; }
  get isAuthorized() { return this._isAuthorized; }
  get loading() { return this._loading; }
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
    djData: DJ | null;
    currentEvent: Event | null;
    eventTitle: string;
    eventImage: string;
    settings: AdminSettings;
    sliderValue: number[];
    selectedFile: File | null;
    imagePreview: string | null;
    loadingStates: Record<string, boolean>;
    isAuthorized: boolean;
    loading: boolean;
    error: string | null;
    wsConnected: boolean;
  }>) {
    if (newState.djData !== undefined) this._djData = newState.djData;
    if (newState.currentEvent !== undefined) this._currentEvent = newState.currentEvent;
    if (newState.eventTitle !== undefined) this._eventTitle = newState.eventTitle;
    if (newState.eventImage !== undefined) this._eventImage = newState.eventImage;
    if (newState.settings !== undefined) this._settings = newState.settings;
    if (newState.sliderValue !== undefined) this._sliderValue = newState.sliderValue;
    if (newState.selectedFile !== undefined) this._selectedFile = newState.selectedFile;
    if (newState.imagePreview !== undefined) this._imagePreview = newState.imagePreview;
    if (newState.loadingStates !== undefined) this._loadingStates = newState.loadingStates;
    if (newState.isAuthorized !== undefined) this._isAuthorized = newState.isAuthorized;
    if (newState.loading !== undefined) this._loading = newState.loading;
    if (newState.error !== undefined) this._error = newState.error;
    if (newState.wsConnected !== undefined) this._wsConnected = newState.wsConnected;
    
    this.notifyListeners();
  }
  
  // Basic actions
  setDjData(data: DJ): void {
    this.setState({ djData: data });
  }
  
  setEventTitle(title: string): void {
    this.setState({ eventTitle: title });
  }
  
  setEventImage(image: string): void {
    this.setState({ eventImage: image });
  }
  
  setSettings(settings: Partial<AdminSettings>): void {
    this.setState({ 
      settings: { ...this._settings, ...settings } 
    });
  }
  
  setSliderValue(value: number[]): void {
    this.setState({ sliderValue: value });
  }
  
  setSelectedFile(file: File | null): void {
    this.setState({ selectedFile: file });
  }
  
  setImagePreview(preview: string | null): void {
    this.setState({ imagePreview: preview });
  }
  
  setLoadingState(requestId: string, loading: boolean): void {
    this.setState({ 
      loadingStates: { ...this._loadingStates, [requestId]: loading } 
    });
  }
  
  setIsAuthorized(authorized: boolean): void {
    this.setState({ isAuthorized: authorized });
  }
  
  setLoading(loading: boolean): void {
    this.setState({ loading });
  }
  
  clearError(): void {
    this.setState({ error: null });
  }
  
  // API Actions
  async fetchDj(djId: string): Promise<DJ | null> {
    this.setState({ loading: true });
    try {
      const djData = await fetchDjById(djId);
      if (!djData.error) {
        this.setState({ djData, loading: false });
        return djData;
      }
      this.setState({ loading: false, error: "Failed to fetch DJ data" });
      return null;
    } catch (error) {
      console.error("Error fetching DJ data:", error);
      this.setState({ 
        loading: false, 
        error: error instanceof Error ? error.message : "Failed to fetch DJ data" 
      });
      return null;
    }
  }
  
  async checkAuthorization(userId: string, eventId: string): Promise<boolean> {
    this.setState({ loading: true });
    try {
      const eventData = await fetchEventById(eventId);
      
      if (eventData?.djId) {
        // If event has a DJ ID, check if it matches the user
        if (userId === eventData.djId) {
          this.setState({ isAuthorized: true, loading: false });
          return true;
        }
        
        // If not, fetch the DJ data to double-check
        const djData = await fetchDjById(eventData.djId);
        if (djData && userId === djData.djId) {
          this.setState({ djData, isAuthorized: true, loading: false });
          return true;
        }
      } else {
        // Fallback to localStorage
        const storedDjId = localStorage.getItem("djId");
        if (storedDjId) {
          const djData = await fetchDjById(storedDjId);
          if (djData && userId === djData.djId) {
            this.setState({ djData, isAuthorized: true, loading: false });
            return true;
          }
        }
      }
      
      this.setState({ isAuthorized: false, loading: false });
      return false;
    } catch (error) {
      console.error("Error checking authorization:", error);
      this.setState({ 
        isAuthorized: false, 
        loading: false,
        error: error instanceof Error ? error.message : "Failed to check authorization" 
      });
      return false;
    }
  }
  
  async acceptRequestFunc(requestId: string, accessToken: string): Promise<boolean> {
    this.setLoadingState(requestId, true);
    try {
      await acceptRequest(requestId, accessToken);
      this.setLoadingState(requestId, false);
      return true;
    } catch (error) {
      console.error("Error accepting request:", error);
      this.setLoadingState(requestId, false);
      this.setState({
        error: error instanceof Error ? error.message : "Failed to accept request"
      });
      return false;
    }
  }
  
  async playedRequest(requestId: string, accessToken: string, requests: Request[]): Promise<boolean> {
    this.setLoadingState(requestId, true);
    
    try {
      const request = requests.find(req => req.requestId === requestId);
      if (!request?.paymentId) return false;
      
      const paymentData = await fetchPaymentById(request.paymentId);
      await capturePaymentIntent(request.paymentId, paymentData.amount);
      await markRequestAsPlayed(requestId, accessToken);
      
      this.setLoadingState(requestId, false);
      return true;
    } catch (error) {
      console.error("Error processing payment:", error);
      this.setLoadingState(requestId, false);
      this.setState({
        error: error instanceof Error ? error.message : "Failed to mark request as played"
      });
      return false;
    }
  }
  
  async declineRequest(requestId: string, accessToken: string, paymentId: string): Promise<boolean> {
    this.setLoadingState(requestId, true);
    
    try {
      await declineRequestAPI(requestId, accessToken, paymentId);
      this.setLoadingState(requestId, false);
      return true;
    } catch (error) {
      console.error("Error declining request:", error);
      this.setLoadingState(requestId, false);
      this.setState({
        error: error instanceof Error ? error.message : "Failed to decline request"
      });
      return false;
    }
  }
  
  async handleDeleteEvent(eventId: string, accessToken: string): Promise<boolean> {
    this.setState({ loading: true });
    try {
      await deleteEvent(eventId, accessToken);
      this.setState({ loading: false });
      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      this.setState({ 
        loading: false,
        error: error instanceof Error ? error.message : "Failed to delete event"
      });
      return false;
    }
  }
  
  async updateEventSettings(eventId: string, data: any, accessToken: string): Promise<boolean> {
    try {
      const response = await updateEvent(eventId, data, accessToken);
      if (response?.eventId) {
        return true;
      }
      this.setState({ 
        loading: false,
        error: "Failed to update event settings"
      });
      return false;
    } catch (error) {
      console.error("Error updating event settings:", error);
      this.setState({ 
        loading: false,
        error: error instanceof Error ? error.message : "Failed to update event settings"
      });
      return false;
    }
  }
  
  async uploadFile(file: File): Promise<string | null> {
    try {
      const data = new FormData();
      data.append("file", file);
      const s3response = await uploadFileApi(data);
      
      if (s3response?.url) {
        this.setState({ loading: false });
        return s3response.url;
      }
      this.setState({ 
        loading: false,
        error: "Failed to upload file"
      });
      return null;
    } catch (error) {
      console.error("Error uploading file:", error);
      this.setState({ 
        loading: false,
        error: error instanceof Error ? error.message : "Failed to upload file"
      });
      return null;
    }
  }
  
  connectToEventSocket(eventId: string): void {
    const wsService = WebSocketService.getInstance();
    wsService.connect(eventId);
    this.setState({ wsConnected: true });
  }
  
  disconnectFromEventSocket(): void {
    WebSocketService.getInstance().disconnect();
    this.setState({ wsConnected: false });
  }
}

// Create a hook to use the store in React components
import { useState, useEffect } from 'react';

export function useAdminStore() {
  // Create a new store instance for this component
  const [store] = useState(() => new AdminStore());
  
  // Force re-render when store changes
  const [, setForceUpdate] = useState({});
  
  useEffect(() => {
    // Subscribe to store changes
    const unsubscribe = store.subscribe(() => {
      setForceUpdate({});
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, [store]);
  
  return store;
}