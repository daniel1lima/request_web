import { create } from 'zustand';
import { 
  fetchAllEvents, 
  fetchEventById, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  EventData
} from '../api/apiService';

export interface Event {
  eventId: string;
  eventName: string;
  eventImage: string;
  eventDateTime: string;
  eventLocation: string;
  requestFee: number;
  djId: string;
  currentDjId?: string;
  acceptRequests?: boolean;
  acceptFreeRequests?: boolean;
  acceptEmailRequests?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EventState {
  // State
  events: Event[];
  currentEvent: Event | null;
  currentDjId: string | null;
  isLoading: boolean;
  imagesLoaded: boolean;
  error: string | null;
  
  // Actions
  fetchEvents: () => Promise<void>;
  fetchEvent: (eventId: string) => Promise<Event | null>;
  addEvent: (eventData: EventData, accessToken: string) => Promise<void>;
  editEvent: (eventId: string, eventData: Partial<EventData>, accessToken: string) => Promise<void>;
  removeEvent: (eventId: string, accessToken: string) => Promise<void>;
  setImagesLoaded: (loaded: boolean) => void;
  clearError: () => void;
}

const useEventStore = create<EventState>((set) => ({
  // Initial state
  events: [],
  currentEvent: null,
  currentDjId: null,
  isLoading: true, // Start with loading true
  imagesLoaded: false,
  error: null,
  
  // Actions
  fetchEvents: async () => {
    set({ isLoading: true });
    try {
      const events = await fetchAllEvents();
      set({ events, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch events', 
        isLoading: false 
      });
    }
  },
  
  fetchEvent: async (eventId: string) => {
    set({ isLoading: true });
    try {
      const event = await fetchEventById(eventId);
      set({ currentEvent: event, isLoading: false });
      return event;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch event', isLoading: false });
      return null;
    }
  },
  
  addEvent: async (eventData: EventData, accessToken: string) => {
    set({ isLoading: true });
    try {
      const newEvent = await createEvent(eventData, accessToken);
      set((state) => ({ 
        events: [...state.events, newEvent],
        isLoading: false 
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create event', isLoading: false });
    }
  },
  
  editEvent: async (eventId: string, eventData: Partial<EventData>, accessToken: string) => {
    set({ isLoading: true });
    try {
      const updatedEvent = await updateEvent(eventId, eventData, accessToken);
      set((state) => ({
        events: state.events.map(event => 
          event.eventId === eventId ? updatedEvent : event
        ),
        currentEvent: state.currentEvent?.eventId === eventId ? updatedEvent : state.currentEvent,
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update event', isLoading: false });
    }
  },
  
  removeEvent: async (eventId: string, accessToken: string) => {
    set({ isLoading: true });
    try {
      await deleteEvent(eventId, accessToken);
      set((state) => ({
        events: state.events.filter(event => event.eventId !== eventId),
        currentEvent: state.currentEvent?.eventId === eventId ? null : state.currentEvent,
        isLoading: false
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete event', isLoading: false });
    }
  },
  
  setImagesLoaded: (loaded) => set({ imagesLoaded: loaded }),
  clearError: () => set({ error: null }),
}));

export default useEventStore;