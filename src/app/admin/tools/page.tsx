'use client';

import { useState } from 'react';
import { RefreshCw, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminToolsPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ [key: string]: { current: number; total: number; status: string } }>({});

  const pollProgress = (operationId: string, label: string) => {
    console.log(`Starting progress polling for ${label} with operationId: ${operationId}`);
    let pollCount = 0;
    const maxPolls = 300; // 5 minutes max
    let isCompleted = false; // Flag to prevent duplicate completion handling
    
    const pollInterval = setInterval(async () => {
      try {
        pollCount++;
        console.log(`Polling progress for ${label}... (attempt ${pollCount})`);
        const res = await fetch(`/api/admin/products/sync-progress?operationId=${operationId}`);
        console.log(`Polling response for ${label}:`, res.status, res.ok);
        
        if (res.ok) {
          const progressData = await res.json();
          console.log(`Progress data for ${label}:`, progressData);
          
          // Update progress state
          setProgress(prev => ({ ...prev, [label]: progressData }));
          
          // Check if operation is complete (only handle once)
          if (!isCompleted && (progressData.status === 'Complete' || progressData.status === 'Error occurred')) {
            isCompleted = true; // Set flag to prevent duplicate handling
            console.log(`Progress complete for ${label}, stopping polling`);
            clearInterval(pollInterval);
            setLoading(null);
            
            // Show success message
            if (progressData.status === 'Complete') {
              let successMessage = '';
              if (label === 'Sync Latest Products') {
                const total = progressData.total || 0;
                successMessage = `Successfully synced ${total} products`;
              } else if (label === 'Backfill Specs') {
                successMessage = `Successfully updated specifications for ${progressData.total || 0} products`;
              } else {
                successMessage = `${label} completed successfully`;
              }
              toast.success(successMessage);
            } else {
              toast.error(`${label} failed`);
            }
            
            // Reset progress after a delay
            setTimeout(() => {
              setProgress(prev => ({ ...prev, [label]: { current: 0, total: 0, status: '' } }));
            }, 3000);
          }
        } else if (res.status === 404) {
          console.log(`Progress not found for ${label}, operation may have completed`);
          // If progress not found, assume operation completed
          if (!isCompleted) {
            isCompleted = true;
            clearInterval(pollInterval);
            setLoading(null);
            setProgress(prev => ({ ...prev, [label]: { current: 100, total: 100, status: 'Complete' } }));
            toast.success(`${label} completed successfully`);
            
            setTimeout(() => {
              setProgress(prev => ({ ...prev, [label]: { current: 0, total: 0, status: '' } }));
            }, 3000);
          }
        } else {
          console.log(`Failed to fetch progress for ${label}:`, res.status);
        }
      } catch (error) {
        console.error('Failed to poll progress:', error);
      }
      
      // Timeout after max polls
      if (pollCount >= maxPolls) {
        console.log(`Polling timeout for ${label}, stopping`);
        if (!isCompleted) {
          isCompleted = true;
          clearInterval(pollInterval);
          setLoading(null);
          setProgress(prev => ({ ...prev, [label]: { current: 100, total: 100, status: 'Complete' } }));
          toast.success(`${label} completed successfully`);
          
          setTimeout(() => {
            setProgress(prev => ({ ...prev, [label]: { current: 0, total: 0, status: '' } }));
          }, 3000);
        }
      }
    }, 500); // Poll every 500ms for more responsive updates

    return pollInterval;
  };

  const call = async (label: string, url: string, options?: RequestInit) => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    try {
      setLoading(label);
      setProgress(prev => ({ ...prev, [label]: { current: 0, total: 0, status: 'Starting...' } }));

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, ...(options?.headers || {}) },
        body: options?.body,
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `${label} failed`);
      
      console.log(`API response for ${label}:`, data);
      console.log(`OperationId in response:`, data.operationId);
      
      // Start polling for progress if we have an operation ID
      if (data.operationId) {
        console.log(`Starting polling for ${label} with operationId: ${data.operationId}`);
        // Start polling immediately
        pollInterval = pollProgress(data.operationId, label);
      } else {
        console.log(`No operationId found in response for ${label}`);
        // For operations without progress tracking, show completion
        console.log(`No operationId for ${label}, showing completion`);
        setProgress(prev => ({ ...prev, [label]: { current: 100, total: 100, status: 'Complete' } }));
        setLoading(null);
        
        // Show success message immediately for non-progress operations
        let successMessage = '';
        if (label === 'Sync Latest Products') {
          const counts = data.counts || {};
          const total = (counts.created || 0) + (counts.updated || 0) + (counts.unchanged || 0);
          successMessage = `Successfully synced ${total} products (${counts.created || 0} created, ${counts.updated || 0} updated, ${counts.unchanged || 0} unchanged)`;
        } else if (label === 'Backfill Specs') {
          successMessage = `Successfully updated specifications for ${data.updated || 0} products`;
        } else {
          successMessage = `${label} completed successfully`;
        }
        toast.success(successMessage);
      }
      
      // Don't show success message immediately - let the polling handle completion
      // The success message will be shown when polling detects completion
      
    } catch (e) {
      console.error(`Error in ${label}:`, e);
      toast.error(e instanceof Error ? e.message : 'Request failed');
      setLoading(null);
      setProgress(prev => ({ ...prev, [label]: { current: 0, total: 0, status: '' } }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Wrench className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-semibold">Admin Tools</h1>
      </div>

      <div className="space-y-6 bg-white border rounded-xl p-6">
        {/* Sync Latest Products Section */}
        <div className="space-y-3">
          <button
            onClick={() => call('Sync Latest Products', '/api/admin/products/sync-external')}
            disabled={loading !== null}
            className="w-full px-4 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading === 'Sync Latest Products' ? 'Syncing…' : 'Sync Latest Products'}
          </button>
          {loading === 'Sync Latest Products' && progress['Sync Latest Products'] && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{progress['Sync Latest Products'].status}</span>
                <span>
                  {progress['Sync Latest Products'].total > 0 
                    ? `${progress['Sync Latest Products'].current}/${progress['Sync Latest Products'].total}`
                    : '0/0'
                  }
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    width: progress['Sync Latest Products'].total > 0 
                      ? `${(progress['Sync Latest Products'].current / progress['Sync Latest Products'].total) * 100}%`
                      : '0%'
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Backfill Specs Section */}
        <div className="space-y-3">
          <button
            onClick={() => call('Backfill Specs', '/api/admin/products/backfill-specs', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 500 }) })}
            disabled={loading !== null}
            className="w-full px-4 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading === 'Backfill Specs' ? 'Backfilling…' : 'Backfill Specs'}
          </button>
          {loading === 'Backfill Specs' && progress['Backfill Specs'] && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{progress['Backfill Specs'].status}</span>
                <span>
                  {progress['Backfill Specs'].total > 0 
                    ? `${progress['Backfill Specs'].current}/${progress['Backfill Specs'].total}`
                    : '0/0'
                  }
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    width: progress['Backfill Specs'].total > 0 
                      ? `${(progress['Backfill Specs'].current / progress['Backfill Specs'].total) * 100}%`
                      : '0%'
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
