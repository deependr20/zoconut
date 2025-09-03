'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface UseRealtimeOptions {
  onMessage?: (event: RealtimeEvent) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
  onTyping?: (data: { userId: string; isTyping: boolean }) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const {
    onMessage,
    onUserOnline,
    onUserOffline,
    onTyping,
    autoReconnect = true,
    reconnectInterval = 5000
  } = options;

  const connect = useCallback(() => {
    if (!session?.user || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource('/api/realtime/sse');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE message received:', data);
          
          if (onMessage) {
            onMessage({
              type: 'message',
              data,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      // Handle specific event types
      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        console.log('Connected to SSE:', data);
      });

      eventSource.addEventListener('new_message', (event) => {
        const data = JSON.parse(event.data);
        if (onMessage) {
          onMessage({
            type: 'new_message',
            data,
            timestamp: Date.now()
          });
        }
      });

      eventSource.addEventListener('user_online', (event) => {
        const data = JSON.parse(event.data);
        setOnlineUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        if (onUserOnline) {
          onUserOnline(data.userId);
        }
      });

      eventSource.addEventListener('user_offline', (event) => {
        const data = JSON.parse(event.data);
        setOnlineUsers(prev => prev.filter(id => id !== data.userId));
        if (onUserOffline) {
          onUserOffline(data.userId);
        }
      });

      eventSource.addEventListener('typing_start', (event) => {
        const data = JSON.parse(event.data);
        if (onTyping) {
          onTyping({ userId: data.userId, isTyping: true });
        }
      });

      eventSource.addEventListener('typing_stop', (event) => {
        const data = JSON.parse(event.data);
        if (onTyping) {
          onTyping({ userId: data.userId, isTyping: false });
        }
      });

      eventSource.addEventListener('heartbeat', (event) => {
        // Handle heartbeat to keep connection alive
        console.log('Heartbeat received');
      });

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        setConnectionError('Connection lost');
        
        if (autoReconnect && reconnectAttemptsRef.current < 5) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            disconnect();
            connect();
          }, reconnectInterval * reconnectAttemptsRef.current);
        }
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setConnectionError('Failed to connect');
    }
  }, [session, onMessage, onUserOnline, onUserOffline, onTyping, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  // Send typing indicator
  const sendTyping = useCallback(async (receiverId: string, isTyping: boolean) => {
    try {
      await fetch('/api/realtime/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId, isTyping })
      });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  }, []);

  // Send heartbeat to maintain online status
  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch('/api/realtime/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'heartbeat' })
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  }, []);

  // Mark message as read
  const markMessageAsRead = useCallback(async (messageId: string) => {
    try {
      await fetch('/api/messages/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, status: 'read' })
      });
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, []);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationWith: string) => {
    try {
      await fetch('/api/messages/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationWith, status: 'read' })
      });
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  }, []);

  // Connect when session is available
  useEffect(() => {
    if (session?.user) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [session, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Set up heartbeat interval
  useEffect(() => {
    if (isConnected) {
      const heartbeatInterval = setInterval(sendHeartbeat, 30000); // Every 30 seconds
      return () => clearInterval(heartbeatInterval);
    }
  }, [isConnected, sendHeartbeat]);

  return {
    isConnected,
    connectionError,
    onlineUsers,
    connect,
    disconnect,
    sendTyping,
    sendHeartbeat,
    markMessageAsRead,
    markConversationAsRead
  };
}
