export class UIStore {
  // State
  private _currentView: "explore" | "events" | "user" = "explore";
  private _searchQuery: string = "";
  private _fadeOut: boolean = false;
  private _listeners: Array<() => void> = [];
  
  // Getters
  get currentView() { return this._currentView; }
  get searchQuery() { return this._searchQuery; }
  get fadeOut() { return this._fadeOut; }
  
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
    currentView: "explore" | "events" | "user";
    searchQuery: string;
    fadeOut: boolean;
  }>) {
    if (newState.currentView !== undefined) this._currentView = newState.currentView;
    if (newState.searchQuery !== undefined) this._searchQuery = newState.searchQuery;
    if (newState.fadeOut !== undefined) this._fadeOut = newState.fadeOut;
    
    this.notifyListeners();
  }
  
  // Actions
  setCurrentView(view: "explore" | "events" | "user"): void {
    this.setState({ currentView: view });
  }
  
  setSearchQuery(query: string): void {
    this.setState({ searchQuery: query });
  }
  
  setFadeOut(fadeOut: boolean): void {
    this.setState({ fadeOut });
  }
}

// Create a hook to use the store in React components
import { useState, useEffect } from 'react';

export function useUIStore() {
  // Create a new store instance for this component
  const [store] = useState(() => new UIStore());
  
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