'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, BookOpen, MessageCircle, Plus, Search, Filter, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import BackButton from '@/components/BackButton';
import toast from 'react-hot-toast';

export default function SupportPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'tickets' | 'knowledge' | 'chat'>('tickets');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="mb-6">
            <BackButton 
              href="/profile" 
              variant="with-label" 
              className="text-white/80 hover:text-white border-white/20 hover:bg-white/10"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Customer Support</h1>
          <p className="text-blue-100 text-lg">We're here to help you with any questions or issues</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'tickets'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="h-5 w-5 inline-block mr-2" />
              Support Tickets
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'knowledge'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="h-5 w-5 inline-block mr-2" />
              Knowledge Base
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'chat'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MessageCircle className="h-5 w-5 inline-block mr-2" />
              Live Chat
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'tickets' && (
              <Link href="/support/tickets" className="block">
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Support Tickets</h3>
                  <p className="text-gray-600 mb-6">View and manage your support tickets</p>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    Go to Tickets
                  </button>
                </div>
              </Link>
            )}

            {activeTab === 'knowledge' && (
              <Link href="/support/knowledge-base" className="block">
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Knowledge Base</h3>
                  <p className="text-gray-600 mb-6">Browse helpful articles and FAQs</p>
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    Browse Articles
                  </button>
                </div>
              </Link>
            )}

            {activeTab === 'chat' && (
              <div className="text-center py-12">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Live Chat</h3>
                <p className="text-gray-600 mb-6">Chat with our support team in real-time</p>
                <p className="text-sm text-gray-500 mb-4">Live chat widget is available on all pages</p>
                <p className="text-sm text-gray-500">Look for the chat icon in the bottom right corner</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

