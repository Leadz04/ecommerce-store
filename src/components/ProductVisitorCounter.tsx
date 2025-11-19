'use client';

import { useState, useEffect, useRef } from 'react';
import { Users } from 'lucide-react';

interface ProductVisitorCounterProps {
  productId: string;
}

export default function ProductVisitorCounter({ productId }: ProductVisitorCounterProps) {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Register visitor when component mounts
  useEffect(() => {
    if (!productId) return;

    let mounted = true;

    const registerVisitor = async () => {
      try {
        const response = await fetch(`/api/products/${productId}/visitors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'join',
            sessionId: sessionIdRef.current,
          }),
        });

        if (!response.ok) throw new Error('Failed to register visitor');

        const data = await response.json();
        if (mounted) {
          sessionIdRef.current = data.sessionId;
          setVisitorCount(data.count);
          setIsLoading(false);
          
          // Log for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('[ProductVisitorCounter] Registered visitor:', {
              productId,
              sessionId: data.sessionId,
              count: data.count
            });
          }
        }
      } catch (error) {
        console.error('Error registering visitor:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    registerVisitor();

    // Send heartbeat every 15 seconds to keep session alive
    heartbeatIntervalRef.current = setInterval(async () => {
      if (sessionIdRef.current && mounted) {
        try {
          await fetch(`/api/products/${productId}/visitors`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'heartbeat',
              sessionId: sessionIdRef.current,
            }),
          });
        } catch (error) {
          console.error('Error sending heartbeat:', error);
        }
      }
    }, 15000);

    // Poll for visitor count updates every 3 seconds
    pollIntervalRef.current = setInterval(async () => {
      if (mounted) {
        try {
          const response = await fetch(`/api/products/${productId}/visitors`);
          if (response.ok) {
            const data = await response.json();
            if (mounted) {
              setVisitorCount(data.count);
            }
          }
        } catch (error) {
          console.error('Error fetching visitor count:', error);
        }
      }
    }, 3000);

    // Cleanup on unmount
    return () => {
      mounted = false;
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      // Unregister visitor
      if (sessionIdRef.current) {
        fetch(`/api/products/${productId}/visitors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'leave',
            sessionId: sessionIdRef.current,
          }),
        }).catch(console.error);
      }
    };
  }, [productId]);

  // Handle page visibility change (tab switch, minimize, etc.)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, stop polling but keep session alive
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else {
        // Page is visible again, resume polling
        if (!pollIntervalRef.current && sessionIdRef.current) {
          pollIntervalRef.current = setInterval(async () => {
            try {
              const response = await fetch(`/api/products/${productId}/visitors`);
              if (response.ok) {
                const data = await response.json();
                setVisitorCount(data.count);
              }
            } catch (error) {
              console.error('Error fetching visitor count:', error);
            }
          }, 3000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [productId]);

  // Don't show anything if loading or no visitors
  if (isLoading || visitorCount === null || visitorCount === 0) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
      <div className="relative">
        <Users className="h-4 w-4 text-blue-600 animate-pulse" />
        <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full border-2 border-white"></span>
      </div>
      <span className="text-sm font-semibold text-gray-800">
        <span className="text-blue-600 font-bold">{visitorCount}</span>
        {' '}
        {visitorCount === 1 ? 'person is' : 'people are'} viewing this right now
      </span>
    </div>
  );
}

