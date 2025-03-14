import { fetchDjById } from '../api/apiService';

export interface DJ {
  djId: string;
  djName: string;
  djInsta?: string;
  djImageUrl: string;
}

export class DJStore {
  // State
  private _currentDj: DJ | null = null;
  private _activeDj: DJ | null = null;
  private _isLoading: boolean = false;
  private _error: string | null = null;
  private _listeners: Array<() => void> = [];
  
  // Getters
  get currentDj() { return this._currentDj; }
  get activeDj() { return this._activeDj; }
  get isLoading() { return this._isLoading; }
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
    currentDj: DJ | null;
    activeDj: DJ | null;
    isLoading: boolean;
    error: string | null;
  }>) {
    if (newState.currentDj !== undefined) this._currentDj = newState.currentDj;
    if (newState.activeDj !== undefined) this._activeDj = newState.activeDj;
    if (newState.isLoading !== undefined) this._isLoading = newState.isLoading;
    if (newState.error !== undefined) this._error = newState.error;
    
    this.notifyListeners();
  }
  
  // Actions
  async fetchDj(djId: string): Promise<void> {
    this.setState({ isLoading: true });
    try {
      const dj = await fetchDjById(djId);
      this.setState({ currentDj: dj, isLoading: false });
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to fetch DJ', 
        isLoading: false 
      });
    }
  }
  
  async fetchActiveDj(djId: string): Promise<void> {
    this.setState({ isLoading: true });
    try {
      const dj = await fetchDjById(djId);
      this.setState({ activeDj: dj, isLoading: false });
    } catch (error) {
      this.setState({ 
        error: error instanceof Error ? error.message : 'Failed to fetch active DJ', 
        isLoading: false 
      });
    }
  }
  
  setActiveDj(dj: DJ | null): void {
    this.setState({ activeDj: dj });
  }
  
  clearError(): void {
    this.setState({ error: null });
  }
}

// Create a hook to use the store in React components
import { useState, useEffect } from 'react';

export function useDJStore() {
  // Create a new store instance for this component
  const [store] = useState(() => new DJStore());
  
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