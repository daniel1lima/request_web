import { create } from 'zustand';
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
import { Request } from '@/app/event-admin/page';
import { DJ } from '@/app/event-admin/page';

interface AdminSettings {
  requestFee: number;
  eventImage: string;
  eventName: string;
  acceptRequests: boolean;
  freeRequests: boolean;
  freeEmailRequests: boolean;
}

interface Event {
  eventId: string;
  eventName: string;
  eventImage: string;
  eventDateTime: string;
  eventLocation: string;
  requestFee: number;
  djId: string;
  acceptRequests?: boolean;
  acceptFreeRequests?: boolean;
  acceptEmailRequests?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminState {
  // State
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
  
  // Actions
  setDjData: (data: DJ) => void;
  setEventTitle: (title: string) => void;
  setEventImage: (image: string) => void;
  setSettings: (settings: Partial<AdminSettings>) => void;
  setSliderValue: (value: number[]) => void;
  setSelectedFile: (file: File | null) => void;
  setImagePreview: (preview: string | null) => void;
  setLoadingState: (requestId: string, loading: boolean) => void;
  setIsAuthorized: (authorized: boolean) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  
  // API Actions
  fetchDj: (djId: string) => Promise<DJ | null>;
//   fetchEvent: (eventId: string) => Promise<Event | null>;
  checkAuthorization: (userId: string, eventId: string) => Promise<boolean>;
  acceptRequestFunc: (requestId: string, accessToken: string) => Promise<boolean>;
  playedRequest: (requestId: string, accessToken: string, requests: Request[]) => Promise<boolean>;
  declineRequest: (requestId: string, accessToken: string, paymentId: string) => Promise<boolean>;
  handleDeleteEvent: (eventId: string, accessToken: string) => Promise<boolean>;
  updateEventSettings: (eventId: string, data: any, accessToken: string) => Promise<boolean>;
  uploadFile: (file: File) => Promise<string | null>;
}

const useAdminStore = create<AdminState>((set, get) => ({
  // Initial state
  djData: null,
  currentEvent: null,
  eventTitle: "",
  eventImage: "",
  settings: {
    eventName: "",
    requestFee: 0,
    eventImage: "",
    acceptRequests: false,
    freeRequests: false,
    freeEmailRequests: false,
  },
  sliderValue: [99],
  selectedFile: null,
  imagePreview: null,
  loadingStates: {},
  isAuthorized: false,
  loading: true,
  error: null,
  
  // Basic actions
  setDjData: (data) => set({ djData: data }),
  setEventTitle: (title) => set({ eventTitle: title }),
  setEventImage: (image) => set({ eventImage: image }),
  setSettings: (settings) => set((state) => ({ 
    settings: { ...state.settings, ...settings } 
  })),
  setSliderValue: (value) => set({ sliderValue: value }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setImagePreview: (preview) => set({ imagePreview: preview }),
  setLoadingState: (requestId, loading) => set((state) => ({ 
    loadingStates: { ...state.loadingStates, [requestId]: loading } 
  })),
  setIsAuthorized: (authorized) => set({ isAuthorized: authorized }),
  setLoading: (loading) => set({ loading }),
  clearError: () => set({ error: null }),
  
  // API Actions
  fetchDj: async (djId) => {
    set({ loading: true });
    try {
      const djData = await fetchDjById(djId);
      if (!djData.error) {
        set({ djData, loading: false });
        return djData;
      }
      set({ loading: false, error: "Failed to fetch DJ data" });
      return null;
    } catch (error) {
      console.error("Error fetching DJ data:", error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : "Failed to fetch DJ data" 
      });
      return null;
    }
  },
  
  checkAuthorization: async (userId, eventId) => {
    set({ loading: true });
    try {
      const eventData = await fetchEventById(eventId);
      
      if (eventData?.djId) {
        // If event has a DJ ID, check if it matches the user
        if (userId === eventData.djId) {
          set({ isAuthorized: true, loading: false });
          return true;
        }
        
        // If not, fetch the DJ data to double-check
        const djData = await fetchDjById(eventData.djId);
        if (djData && userId === djData.djId) {
          set({ djData, isAuthorized: true, loading: false });
          return true;
        }
      } else {
        // Fallback to localStorage
        const storedDjId = localStorage.getItem("djId");
        if (storedDjId) {
          const djData = await fetchDjById(storedDjId);
          if (djData && userId === djData.djId) {
            set({ djData, isAuthorized: true, loading: false });
            return true;
          }
        }
      }
      
      set({ isAuthorized: false, loading: false });
      return false;
    } catch (error) {
      console.error("Error checking authorization:", error);
      set({ 
        isAuthorized: false, 
        loading: false,
        error: error instanceof Error ? error.message : "Failed to check authorization" 
      });
      return false;
    }
  },
  
  acceptRequestFunc: async (requestId, accessToken) => {
    set((state) => ({ 
      loadingStates: { ...state.loadingStates, [requestId]: true } 
    }));
    try {
      await acceptRequest(requestId, accessToken);
      set((state) => ({ 
        loadingStates: { ...state.loadingStates, [requestId]: false } 
      }));
      return true;
    } catch (error) {
      console.error("Error accepting request:", error);
      set((state) => ({ 
        loadingStates: { ...state.loadingStates, [requestId]: false },
        error: error instanceof Error ? error.message : "Failed to accept request"
      }));
      return false;
    }
  },
  
  playedRequest: async (requestId, accessToken, requests) => {
    set((state) => ({ 
      loadingStates: { ...state.loadingStates, [requestId]: true } 
    }));
    
    try {
      const request = requests.find(req => req.requestId === requestId);
      if (!request?.paymentId) return false;
      
      const paymentData = await fetchPaymentById(request.paymentId);
      await capturePaymentIntent(request.paymentId, paymentData.amount);
      await markRequestAsPlayed(requestId, accessToken);
      
      set((state) => ({ 
        loadingStates: { ...state.loadingStates, [requestId]: false } 
      }));
      return true;
    } catch (error) {
      console.error("Error processing payment:", error);
      set((state) => ({ 
        loadingStates: { ...state.loadingStates, [requestId]: false },
        error: error instanceof Error ? error.message : "Failed to mark request as played"
      }));
      return false;
    }
  },
  
  declineRequest: async (requestId, accessToken, paymentId) => {
    set((state) => ({ 
      loadingStates: { ...state.loadingStates, [requestId]: true } 
    }));
    
    try {
      await declineRequestAPI(requestId, accessToken, paymentId);
      set((state) => ({ 
        loadingStates: { ...state.loadingStates, [requestId]: false } 
      }));
      return true;
    } catch (error) {
      console.error("Error declining request:", error);
      set((state) => ({ 
        loadingStates: { ...state.loadingStates, [requestId]: false },
        error: error instanceof Error ? error.message : "Failed to decline request"
      }));
      return false;
    }
  },
  
  handleDeleteEvent: async (eventId, accessToken) => {
    set({ loading: true });
    try {
      await deleteEvent(eventId, accessToken);
      set({ loading: false });
      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      set({ 
        loading: false,
        error: error instanceof Error ? error.message : "Failed to delete event"
      });
      return false;
    }
  },
  
  updateEventSettings: async (eventId, data, accessToken) => {
    // set({ loading: true });
    try {
      const response = await updateEvent(eventId, data, accessToken);
      if (response?.eventId) {
        // set({ loading: false });
        return true;
      }
      set({ 
        loading: false,
        error: "Failed to update event settings"
      });
      return false;
    } catch (error) {
      console.error("Error updating event settings:", error);
      set({ 
        loading: false,
        error: error instanceof Error ? error.message : "Failed to update event settings"
      });
      return false;
    }
  },
  
  uploadFile: async (file) => {
    // set({ loading: true });
    try {
      const data = new FormData();
      data.append("file", file);
      const s3response = await uploadFileApi(data);
      
      if (s3response?.url) {
        set({ loading: false });
        return s3response.url;
      }
      set({ 
        loading: false,
        error: "Failed to upload file"
      });
      return null;
    } catch (error) {
      console.error("Error uploading file:", error);
      set({ 
        loading: false,
        error: error instanceof Error ? error.message : "Failed to upload file"
      });
      return null;
    }
  }
}));

export default useAdminStore;