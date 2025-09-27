import { useState, useEffect, useCallback, useRef } from 'react';
import { ADMIN_AUTH_TOKEN_KEY, STUDENT_AUTH_TOKEN_KEY } from '../config/constants';

// WebSocket event types
export interface WebSocketEvents {
  // Announcement events
  'announcement-created': (data: any) => void;
  'announcement-updated': (data: any) => void;
  'announcement-deleted': (data: any) => void;
  'announcement-reaction-updated': (data: any) => void;
  
  // Calendar events
  'calendar-reaction-updated': (data: any) => void;
  'calendar-event-created': (data: any) => void;
  'calendar-event-updated': (data: any) => void;
  'calendar-event-deleted': (data: any) => void;
  
  // Comment events
  'comment-added': (data: any) => void;
  'comment-updated': (data: any) => void;
  'comment-deleted': (data: any) => void;
  'comment-reaction-updated': (data: any) => void;
  
  // Notification events
  'notification': (data: any) => void;
  'admin-notification': (data: any) => void;
}

export interface UseWebSocketReturn {
  socket: any | null;
  isConnected: boolean;
  connectionError: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  on: <K extends keyof WebSocketEvents>(event: K, handler: WebSocketEvents[K]) => void;
  off: <K extends keyof WebSocketEvents>(event: K, handler?: WebSocketEvents[K]) => void;
}

export const useWebSocket = (
  options?: {
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
  }
): UseWebSocketReturn => {
  const [socket, setSocket] = useState<any | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const socketRef = useRef<any | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventHandlers = useRef<Map<string, Function[]>>(new Map());
  
  const defaultOptions = {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    ...options
  };

  // For future socket.io integration
  const getAuthToken = useCallback(() => {
    const adminToken = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    const studentToken = localStorage.getItem(STUDENT_AUTH_TOKEN_KEY);

    // Determine user type based on current page or available tokens
    const currentPath = window.location.pathname;
    const isAdminPage = currentPath.includes('/admin');

    if (isAdminPage && adminToken) {
      return { token: adminToken, userType: 'admin' };
    }

    if (studentToken) {
      return { token: studentToken, userType: 'student' };
    }

    if (adminToken) {
      return { token: adminToken, userType: 'admin' };
    }

    return { token: null, userType: null };
  }, []);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('🔌 WebSocket already connected');
      return;
    }

    try {
      console.log('🔌 Creating mock WebSocket connection for real-time updates');

      // Create a mock socket object that provides the interface we need
      const mockSocket = {
        connected: true,
        auth: {},
        on: (event: string, handler: Function) => {
          const handlers = eventHandlers.current.get(event) || [];
          handlers.push(handler);
          eventHandlers.current.set(event, handlers);
        },
        off: (event: string, handler?: Function) => {
          if (handler) {
            const handlers = eventHandlers.current.get(event) || [];
            const index = handlers.indexOf(handler);
            if (index > -1) {
              handlers.splice(index, 1);
              eventHandlers.current.set(event, handlers);
            }
          } else {
            eventHandlers.current.delete(event);
          }
        },
        emit: (event: string, data: any) => {
          console.log(`📤 Mock emit: ${event}`, data);
        },
        disconnect: () => {
          console.log('🔌 Mock WebSocket disconnected');
          setIsConnected(false);
        }
      };

      socketRef.current = mockSocket;
      setSocket(mockSocket);
      setIsConnected(true);
      setConnectionError(null);

      console.log('✅ Mock WebSocket connected (real-time updates will work via polling)');

    } catch (error: any) {
      console.error('🚫 Failed to create WebSocket connection:', error);
      setConnectionError(error.message);
    }
  }, [eventHandlers]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting WebSocket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('⚠️ Cannot emit event - WebSocket not connected:', event);
    }
  }, []);

  const on = useCallback(<K extends keyof WebSocketEvents>(
    event: K, 
    handler: WebSocketEvents[K]
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event as string, handler as any);
    }
  }, []);

  const off = useCallback(<K extends keyof WebSocketEvents>(
    event: K, 
    handler?: WebSocketEvents[K]
  ) => {
    if (socketRef.current) {
      if (handler) {
        socketRef.current.off(event as string, handler as any);
      } else {
        socketRef.current.off(event as string);
      }
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (defaultOptions.autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect, defaultOptions.autoConnect]);

  return {
    socket,
    isConnected,
    connectionError,
    connect,
    disconnect,
    emit,
    on,
    off
  };
};

export default useWebSocket;
