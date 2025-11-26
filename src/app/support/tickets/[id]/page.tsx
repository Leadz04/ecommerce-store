'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import BackButton from '@/components/BackButton';
import toast from 'react-hot-toast';
import { Send, Clock, CheckCircle, XCircle, AlertCircle, User, Shield } from 'lucide-react';

interface Ticket {
  _id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  messages: Array<{
    _id: string;
    senderName: string;
    senderType: string;
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
}

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ticketId = Array.isArray(params?.id) ? params?.id[0] : params?.id;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId, isAuthenticated]);

  const fetchTicket = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch ticket');
      }

      setTicket(data.ticket);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to load ticket');
      router.push('/support/tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticket) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/support/tickets/${ticket._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setNewMessage('');
      fetchTicket(); // Refresh ticket
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'waiting_customer':
        return <Clock className="h-5 w-5 text-orange-600" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'closed':
        return <XCircle className="h-5 w-5 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'waiting_customer':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <BackButton href="/support/tickets" variant="with-label" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
              <p className="text-gray-600 mt-1">{ticket.subject}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}>
                {getStatusIcon(ticket.status)}
                <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-6">
            {ticket.messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex gap-4 ${msg.senderType === 'admin' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  msg.senderType === 'admin' ? 'bg-blue-600' : 'bg-gray-300'
                }`}>
                  {msg.senderType === 'admin' ? (
                    <Shield className="h-5 w-5 text-white" />
                  ) : (
                    <User className="h-5 w-5 text-gray-700" />
                  )}
                </div>
                <div className={`flex-1 ${msg.senderType === 'admin' ? 'text-right' : ''}`}>
                  <div className={`inline-block max-w-[80%] p-4 rounded-lg ${
                    msg.senderType === 'admin'
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <p className="font-semibold text-sm mb-1">{msg.senderName}</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Form */}
        {ticket.status !== 'closed' && (
          <form onSubmit={handleSendMessage} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex gap-4">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={4}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                placeholder="Type your message..."
                required
                maxLength={5000}
              />
              <button
                type="submit"
                disabled={isSubmitting || !newMessage.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="h-5 w-5" />
                <span>Send</span>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {newMessage.length}/5000 characters
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

