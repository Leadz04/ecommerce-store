'use client';

import { useEffect, useRef, useState } from 'react';

export type RealtimeEvent = {
  type: string;
  data: any;
  timestamp: number;
};

export function useRealtime(channel: string, onEvent?: (event: RealtimeEvent) => void) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  useEffect(() => {
    connectToChannel();
    
    return () => {
      disconnectFromChannel();
    };
  }, [channel]);
  
  const connectToChannel = () => {
    if (eventSourceRef.current) {
      return; // Already connected
    }
    
    try {
      const eventSource = new EventSource(`/api/realtime/${channel}`);
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log(`[Realtime] Connected to ${channel}`);
        setConnected(true);
        reconnectAttempts.current = 0;
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);
          onEvent?.(data);
        } catch (error) {
          console.error('[Realtime] Failed to parse event:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error(`[Realtime] Connection error on ${channel}:`, error);
        setConnected(false);
        disconnectFromChannel();
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`[Realtime] Reconnecting in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectToChannel();
          }, delay);
        }
      };
    } catch (error) {
      console.error('[Realtime] Failed to create EventSource:', error);
    }
  };
  
  const disconnectFromChannel = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setConnected(false);
  };
  
  return {
    connected,
    lastEvent,
    reconnect: connectToChannel,
    disconnect: disconnectFromChannel
  };
}

