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
  DJs: {
    djId: string;
    djName: string;
    djImageUrl: string;
    djInsta?: string;
  }[];
}

export class EventStore {
  // State
  private _events: Event[] = [];
  private _currentEvent: Event | null = null;
  private _currentDjId: string | null = null;
  private _isLoading: boolean = true;
  private _imagesLoaded: boolean = false;
  private _error: string | null = null;
  private _listeners: Array<() => void> = [];
  
  // Getters
  get events() { return this._events; }
  get currentEvent() { return this._currentEvent; }
  get currentDjId() { return this._currentDjId; }
  get isLoading() { return this._isLoading; }
  get imagesLoaded() { return this._imagesLoaded; }
  get error() { return this._error; }
  
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
    events: Event[];
    currentEvent: Event | null;
    currentDjId: string | null;
    isLoading: boolean;
    imagesLoaded: boolean;
    error: string | null;
  }>) {
    if (newState.events !== undefined) this._events = newState.events;
    if (newState.currentEvent !== undefined) this._currentEvent = newState.currentEvent;
    if (newState.currentDjId !== undefined) this._currentDjId = newState.currentDjId;
    if (newState.isLoading !== undefined) this._isLoading = newState.isLoading;
    if (newState.imagesLoaded !== undefined) this._imagesLoaded = newState.imagesLoaded;
    if (newState.error !== undefined) this._error = newState.error;
    
    this.notifyListeners();
  }
  
  // Actions
  async fetchEvents(): Promise<void> {
    this.setState({ isLoading: true });
    try {
      const events = await fetchAllEvents();
      this.setState({ events, isLoading: false });
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to fetch events', 
        isLoading: false 
      });
    }
  }
  
  async fetchEvent(eventId: string): Promise<Event | null> {
    this.setState({ isLoading: true });
    try {
      const event = await fetchEventById(eventId);
      this.setState({ currentEvent: event, isLoading: false });
      return event;
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to fetch event', 
        isLoading: false 
      });
      return null;
    }
  }
  
  async addEvent(eventData: EventData, accessToken: string): Promise<void> {
    this.setState({ isLoading: true });
    try {
      const newEvent = await createEvent(eventData, accessToken);
      this.setState({ 
        events: [...this._events, newEvent],
        isLoading: false 
      });
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to create event', 
        isLoading: false 
      });
    }
  }
  
  async editEvent(eventId: string, eventData: Partial<EventData>, accessToken: string): Promise<void> {
    this.setState({ isLoading: true });
    try {
      const updatedEvent = await updateEvent(eventId, eventData, accessToken);
      this.setState({
        events: this._events.map(event => 
          event.eventId === eventId ? updatedEvent : event
        ),
        currentEvent: this._currentEvent?.eventId === eventId ? updatedEvent : this._currentEvent,
        isLoading: false
      });
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to update event', 
        isLoading: false 
      });
    }
  }
  
  async removeEvent(eventId: string, accessToken: string): Promise<void> {
    this.setState({ isLoading: true });
    try {
      await deleteEvent(eventId, accessToken);
      this.setState({
        events: this._events.filter(event => event.eventId !== eventId),
        currentEvent: this._currentEvent?.eventId === eventId ? null : this._currentEvent,
        isLoading: false
      });
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to delete event', 
        isLoading: false 
      });
    }
  }
  
  setImagesLoaded(loaded: boolean): void {
    this.setState({ imagesLoaded: loaded });
  }
  
  clearError(): void {
    this.setState({ error: null });
  }
}

// Create a hook to use the store in React components
import { useState, useEffect } from 'react';

export function useEventStore() {
  // Create a new store instance for this component
  const [store] = useState(() => new EventStore());
  
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