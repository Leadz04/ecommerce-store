'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface ChatMessage {
  _id: string;
  senderName: string;
  senderType: 'customer' | 'admin' | 'bot';
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function LiveChatWidget() {
  const { isAuthenticated, user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const conversationIdRef = useRef<string | null>(null); // Track conversationId for polling
  const isOpenRef = useRef<boolean>(false); // Track isOpen state for polling

  // Update refs whenever state changes
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Initialize conversation ID based on authentication status
      let id: string | null = null;
      
      if (isAuthenticated && user) {
        // For authenticated users, always use their user ID
        id = user.id || user._id || null;
        if (!id) {
          console.warn('[LiveChatWidget] User is authenticated but has no ID');
        } else {
          // Clear any guest conversation ID from localStorage when user logs in
          if (localStorage.getItem('chatConversationId')) {
            localStorage.removeItem('chatConversationId');
          }
          
          // Initialize/create conversation for logged-in user
          // This will be done by the API when fetching messages
          console.log('[LiveChatWidget] Initializing chat for authenticated user:', id);
        }
      } else {
        // For guests, use localStorage to persist conversation ID
        const storedId = localStorage.getItem('chatConversationId');
        if (storedId) {
          id = storedId;
        } else {
          // Generate new guest ID based on email if available, otherwise timestamp
          id = user?.email ? `guest_${user.email.toLowerCase()}` : `guest_${Date.now()}`;
          localStorage.setItem('chatConversationId', id);
        }
      }
      
      // Update conversationId if it changed (e.g., user just logged in)
      if (id && id !== conversationId) {
        setConversationId(id);
      }
      
      // Fetch messages immediately when chat opens
      // For authenticated users, this will also create the conversation if needed
      if (id) {
        fetchMessages(id);
      }
    } else {
      // Stop polling when chat is closed
      stopPolling();
    }

    // Cleanup function - stop polling when component unmounts or chat closes
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isAuthenticated, user]);

  // Start/restart polling when conversationId changes and chat is open
  useEffect(() => {
    if (isOpen && conversationId) {
      stopPolling(); // Stop any existing polling
      startPolling(); // Start new polling with current conversationId
      
      // Also fetch messages immediately
      fetchMessages(conversationId);
      
      return () => {
        stopPolling();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, isOpen]);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Prevent body scroll on mobile when chat is open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isOpen && !isMinimized && window.innerWidth < 640) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isMinimized]);

  // Reset conversation when authentication state changes
  useEffect(() => {
    if (!isAuthenticated && conversationId && !conversationId.startsWith('guest_')) {
      // User logged out - clear conversation
      setConversationId(null);
      setMessages([]);
    }
  }, [isAuthenticated, conversationId]);

  const fetchMessages = async (convId: string) => {
    setIsLoading(true);
    try {
      // Always get token - it should be available if user is logged in
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      
      // Always include token if available (for authenticated users)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams({ conversationId: convId });
      
      // For authenticated users, ensure we're using their ID
      if (isAuthenticated && user && (user.id || user._id)) {
        const userId = user.id || user._id;
        // If conversationId doesn't match user ID, use user ID instead
        if (convId !== userId) {
          params.set('conversationId', userId);
        }
      } else if (!isAuthenticated && user?.email) {
        // For guests, include email
        params.set('guestEmail', user.email);
      }

      const response = await fetch(`/api/chat?${params.toString()}`, { headers });
      
      if (!response.ok) {
        // If 403 and user is authenticated, they might be trying to access wrong conversation
        if (response.status === 403 && isAuthenticated) {
          console.warn('[LiveChatWidget] Unauthorized access to conversation. Resetting conversation ID.');
          // Reset to user's ID
          if (user && (user.id || user._id)) {
            const userId = user.id || user._id;
            setConversationId(userId);
            return; // Will retry with correct ID on next poll
          }
        }
        const data = await response.json().catch(() => ({}));
        console.error('[LiveChatWidget] Failed to fetch messages:', data.error || 'Unknown error');
        return;
      }
      
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('[LiveChatWidget] Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for polling
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const startPolling = () => {
    // Clear any existing polling first
    stopPolling();

    // Only start polling if chat is open and we have a conversationId
    if (!isOpenRef.current || !conversationIdRef.current) {
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      // Always use the ref values to get the latest state
      const currentConvId = conversationIdRef.current;
      const chatIsOpen = isOpenRef.current;
      
      if (currentConvId && chatIsOpen) {
        try {
          await fetchMessages(currentConvId);
        } catch (error) {
          console.error('[LiveChatWidget] Error in polling:', error);
          // Don't stop polling on error, just log it
        }
      } else {
        // Stop polling if conversationId is gone or chat is closed
        stopPolling();
      }
    }, 3000); // Poll every 3 seconds
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure we have a valid conversationId
    let convId = conversationId;
    if (!convId) {
      if (isAuthenticated && user && (user.id || user._id)) {
        convId = user.id || user._id;
        setConversationId(convId);
      } else {
        toast.error('Unable to start conversation. Please refresh the page.');
        return;
      }
    }

    if (!newMessage.trim() || !convId) return;

    setIsSending(true);
    try {
      // Always get token - it should be available if user is logged in
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      // Always include token if available (for authenticated users)
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // For authenticated users, ensure we use their user ID
      if (isAuthenticated && user && (user.id || user._id)) {
        const userId = user.id || user._id;
        if (convId !== userId) {
          convId = userId;
          setConversationId(convId);
        }
      }

      const payload: any = {
        message: newMessage,
        conversationId: convId,
      };

      if (!isAuthenticated && user?.email) {
        payload.guestEmail = user.email;
        payload.guestName = user.name || 'Guest';
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        // Handle 403 errors - might need to reset conversationId
        if (response.status === 403 && isAuthenticated && user && (user.id || user._id)) {
          const userId = user.id || user._id;
          setConversationId(userId);
          toast.error('Conversation reset. Please try sending again.');
          return;
        }
        throw new Error(data.error || 'Failed to send message');
      }

      setNewMessage('');
      setMessages((prev) => [...prev, data.message]);
      scrollToBottom();
    } catch (error) {
      console.error('[LiveChatWidget] Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full p-3 sm:p-4 shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 z-50 group"
        aria-label="Open chat"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-12 transition-transform duration-300" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
      </button>
    );
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && !isMinimized && (
        <div 
          className="fixed inset-0 bg-black/30 sm:hidden z-40 animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <div className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 bg-white rounded-t-2xl sm:rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col ${
        isMinimized 
          ? 'w-full sm:w-80 h-16' 
          : 'w-full h-[calc(100vh-1rem)] sm:w-[420px] sm:h-[600px] sm:max-h-[85vh]'
      } transition-all duration-300 ease-in-out`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-3 sm:p-4 rounded-t-2xl sm:rounded-t-lg flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm sm:text-base">Live Chat Support</span>
            <span className="text-xs text-white/80 hidden sm:inline">We're here to help</span>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" /> : <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors active:scale-95"
            aria-label="Close"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 scroll-smooth">
            {isLoading && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-gray-500">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full p-4 mb-4">
                  <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                </div>
                <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  Start a conversation with our support team!
                </p>
                <p className="text-sm text-gray-600 max-w-xs">
                  We typically respond within a few minutes. Ask us anything!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.senderType === 'admin';
                const isCustomer = msg.senderType === 'customer';
                return (
                  <div
                    key={msg._id}
                    className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl shadow-sm ${
                        isAdmin
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tl-sm'
                          : 'bg-white text-gray-900 border border-gray-200 rounded-tr-sm'
                      }`}
                    >
                      <div className="p-3 sm:p-4">
                        <p className={`text-xs font-semibold mb-1.5 ${isAdmin ? 'text-white/90' : 'text-gray-600'}`}>
                          {isAdmin ? 'Support Team' : msg.senderName}
                        </p>
                        <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words ${isAdmin ? 'text-white' : 'text-gray-900'}`}>
                          {msg.message}
                        </p>
                        <p className={`text-xs mt-2 ${isAdmin ? 'text-white/70' : 'text-gray-500'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-gray-200 bg-white rounded-b-2xl sm:rounded-b-lg">
            <div className="flex gap-2 sm:gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 text-sm sm:text-base bg-gray-50 focus:bg-white transition-colors"
                disabled={isSending}
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center min-w-[48px] sm:min-w-[56px]"
                aria-label="Send message"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            {newMessage.length > 0 && (
              <p className="text-xs text-gray-500 mt-2 text-right">
                {newMessage.length}/2000
              </p>
            )}
          </form>
        </>
      )}
      </div>
    </>
  );
}

