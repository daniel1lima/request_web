type MessageHandler = (data: any) => void;

class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private eventId: string | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private storeUpdateCallbacks: Map<string, (data: any) => void> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // Method to register store update callbacks
  public registerStoreCallback(storeId: string, callback: (data: any) => void): void {
    this.storeUpdateCallbacks.set(storeId, callback);
    console.log(`Registered store callback for ${storeId}`);
  }

  // Method to unregister store callbacks
  public unregisterStoreCallback(storeId: string): void {
    this.storeUpdateCallbacks.delete(storeId);
    console.log(`Unregistered store callback for ${storeId}`);
  }

  public connect(eventId: string): void {
    if (this.socket?.readyState === WebSocket.OPEN && this.eventId === eventId) {
      console.log("WebSocket already connected to this event");
      return;
    }

    if (this.isConnecting) {
      console.log("WebSocket connection already in progress");
      return;
    }

    this.disconnect();
    this.eventId = eventId;
    this.isConnecting = true;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    let wsUrl;
    if (process.env.NEXT_PUBLIC_WS_URL) {
      // Use environment variable if provided
      wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?eventId=${eventId}`;
    } else if (window.location.hostname === 'localhost') {
      // Local development
      wsUrl = `${protocol}//${window.location.hostname}:65534?eventId=${eventId}`;
    } else if (window.location.hostname.includes('request-app.me')) {
      // Production environment with dedicated WebSocket subdomain
      wsUrl = `wss://api.request-app.me?eventId=${eventId}`;
    } else {
      // Fallback for other environments
      wsUrl = `${protocol}//${window.location.host}?eventId=${eventId}`;
    }
    
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log("WebSocket connection established");
      this.reconnectAttempts = 0;
      this.isConnecting = false;
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // console.log("WebSocket message received:", data);
        this.handleMessage(data);
        
        // Also notify registered stores about the update
        this.notifyStores(data);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.socket.onclose = (event) => {
      this.isConnecting = false;
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      
      if (event.code !== 1000 && event.code !== 1001) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      // console.error("WebSocket error:", error);
      this.isConnecting = false;
    };
  }

  // Method to notify registered stores about updates
  private notifyStores(data: any): void {
    // Notify all registered store callbacks
    this.storeUpdateCallbacks.forEach((callback, storeId) => {
      try {
        callback(data);
        // console.log(`Notified store ${storeId} about update`);
      } catch (error) {
        console.error(`Error notifying store ${storeId}:`, error);
      }
    });
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.onclose = null; // Prevent reconnect on intentional disconnect
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close(1000, "Client disconnected");
      }
      this.socket = null;
    }

    this.eventId = null;
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  public subscribe(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    this.messageHandlers.get(type)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    };
  }

  private handleMessage(data: any): void {
    const type = data.type;
    
    if (!type) {
      console.warn("Received WebSocket message without type:", data);
      return;
    }
    
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in WebSocket message handler for type '${type}':`, error);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;
    
    console.log(`Scheduling reconnect attempt in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (this.eventId) {
        console.log(`Attempting to reconnect (attempt #${this.reconnectAttempts})`);
        this.connect(this.eventId);
      }
    }, delay);
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export default WebSocketService; 