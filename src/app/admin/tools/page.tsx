'use client';

import { useEffect, useState, useRef } from 'react';
import { FileCode2, Play, Wrench, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export default function AdminToolsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ [key: string]: { current: number; total: number; status: string } }>({});
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [scriptsError, setScriptsError] = useState<string | null>(null);
  const [scripts, setScripts] = useState<Array<{ name: string; file: string; description?: string }>>([]);
  const [activeScript, setActiveScript] = useState<string | null>(null);
  const [scriptOutputs, setScriptOutputs] = useState<Record<string, { exitCode: number; stdout: string; stderr: string }>>({});
  const [scriptArgs, setScriptArgs] = useState<Record<string, string>>({});
  const [cleanSpecsDryRun, setCleanSpecsDryRun] = useState(true);
  const [cleanSpecsLimit, setCleanSpecsLimit] = useState(1000);
  const [cleanSpecsResult, setCleanSpecsResult] = useState<any>(null);
  const [removeBrandResult, setRemoveBrandResult] = useState<any>(null);
  const [optimizeGeminiLoading, setOptimizeGeminiLoading] = useState(false);
  const [optimizeGeminiLogs, setOptimizeGeminiLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom when new logs are added
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [optimizeGeminiLogs]);

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

  const authorizedFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = options.headers ? { ...(options.headers as Record<string, string>) } : {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return fetch(url, { ...options, headers });
  };

  const call = async (label: string, url: string, options?: RequestInit) => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    try {
      setLoading(label);
      setProgress(prev => ({ ...prev, [label]: { current: 0, total: 0, status: 'Starting...' } }));

      const res = await authorizedFetch(url, {
        method: 'POST',
        headers: options?.headers,
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
        } else if (label === 'Clean Specs') {
          // Store result for Clean Specs
          setCleanSpecsResult(data);
          const summary = data.summary || {};
          successMessage = `${data.message || 'Cleanup completed'}. Modified ${summary.cleanedProducts || 0} products, removed ${summary.totalRemoved || 0} items, renamed ${summary.totalRenamed || 0} specs, added ${summary.totalFAQsAdded || 0} FAQs`;
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

  const handleCleanSpecs = async () => {
    try {
      setLoading('Clean Specs');
      setCleanSpecsResult(null);
      setProgress(prev => ({ ...prev, 'Clean Specs': { current: 0, total: 0, status: 'Starting...' } }));

      const res = await authorizedFetch('/api/admin/products/clean-specs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun: cleanSpecsDryRun,
          limit: cleanSpecsLimit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Clean specs failed');

      setCleanSpecsResult(data);
      setProgress(prev => ({ ...prev, 'Clean Specs': { current: 100, total: 100, status: 'Complete' } }));
      setLoading(null);

      const summary = data.summary || {};
      const message = cleanSpecsDryRun
        ? `Dry run complete. Would modify ${summary.cleanedProducts || 0} products, remove ${summary.totalRemoved || 0} items, rename ${summary.totalRenamed || 0} specs, add ${summary.totalFAQsAdded || 0} FAQs`
        : `Cleanup complete. Modified ${summary.cleanedProducts || 0} products, removed ${summary.totalRemoved || 0} items, renamed ${summary.totalRenamed || 0} specs, added ${summary.totalFAQsAdded || 0} FAQs`;
      
      toast.success(message);
    } catch (e) {
      console.error('Error cleaning specs:', e);
      toast.error(e instanceof Error ? e.message : 'Clean specs failed');
      setLoading(null);
      setProgress(prev => ({ ...prev, 'Clean Specs': { current: 0, total: 0, status: '' } }));
    }
  };

  const handleRemoveBrandName = async () => {
    try {
      setLoading('Remove Brand Name');
      setRemoveBrandResult(null);
      setProgress(prev => ({ ...prev, 'Remove Brand Name': { current: 0, total: 0, status: 'Starting...' } }));

      const res = await authorizedFetch('/api/admin/products/remove-brand-name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Remove brand name failed');

      setRemoveBrandResult(data);
      setProgress(prev => ({ ...prev, 'Remove Brand Name': { current: 100, total: 100, status: 'Complete' } }));
      setLoading(null);

      const summary = data.summary || {};
      toast.success(data.message || `Successfully removed "Everstylecrafts" from ${summary.updatedProducts || 0} products`);
    } catch (e) {
      console.error('Error removing brand name:', e);
      toast.error(e instanceof Error ? e.message : 'Remove brand name failed');
      setLoading(null);
      setProgress(prev => ({ ...prev, 'Remove Brand Name': { current: 0, total: 0, status: '' } }));
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchScripts = async () => {
      if (!user || user.role?.name !== 'SUPER_ADMIN') {
        return;
      }

      setScriptsLoading(true);
      setScriptsError(null);
      try {
        const res = await authorizedFetch('/api/admin/scripts', {
          method: 'GET',
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load scripts');
        }

        const data = await res.json();
        if (isMounted) {
          setScripts(data.scripts || []);
        }
      } catch (error) {
        if (isMounted) {
          setScriptsError(error instanceof Error ? error.message : 'Failed to load scripts');
        }
      } finally {
        if (isMounted) {
          setScriptsLoading(false);
        }
      }
    };

    fetchScripts();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleOptimizeGemini = async () => {
    try {
      setOptimizeGeminiLoading(true);
      setOptimizeGeminiLogs([]);
      
      const res = await authorizedFetch('/api/admin/products/optimize-gemini', {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to start optimization');
      }

      // Read the stream
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'complete') {
                setOptimizeGeminiLoading(false);
                if (data.exitCode === 0) {
                  toast.success('Product optimization completed successfully');
                } else {
                  toast.error(`Optimization completed with exit code ${data.exitCode}`);
                }
                break;
              } else if (data.type === 'log' || data.type === 'error') {
                setOptimizeGeminiLogs(prev => [...prev, data.message]);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Error running optimize script:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to run optimization');
      setOptimizeGeminiLoading(false);
    }
  };

  const handleRunScript = async (file: string) => {
    setActiveScript(file);
    try {
      const args = scriptArgs[file]?.trim() || '';
      const payload = {
        script: file,
        args: args ? args.split(/\s+/) : [],
      };

      const res = await authorizedFetch('/api/admin/scripts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to run script');
      }

      toast.success(`${file} completed with exit code ${data.exitCode}`);
      setScriptOutputs(prev => ({
        ...prev,
        [file]: {
          exitCode: data.exitCode,
          stdout: data.stdout ?? '',
          stderr: data.stderr ?? '',
        },
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Script execution failed');
    } finally {
      setActiveScript(null);
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

        {/* Optimize Products with Gemini Section */}
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Optimize Products with Gemini</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Optimize product titles and tags using Gemini API. Products with stockCount ≠ 5 will be processed and set to 5 after successful optimization. Script will stop automatically if 3 consecutive products fail with all API keys.
          </p>
          
          <button
            onClick={handleOptimizeGemini}
            disabled={optimizeGeminiLoading || loading !== null}
            className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {optimizeGeminiLoading ? 'Optimizing…' : 'Start Optimization'}
          </button>

          {/* Logs Display */}
          {optimizeGeminiLogs.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Logs</h4>
                <button
                  onClick={() => setOptimizeGeminiLogs([])}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              </div>
              <div className="bg-gray-900 text-gray-100 text-xs rounded-md p-4 overflow-auto max-h-96 font-mono">
                {optimizeGeminiLogs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-wrap break-words">
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Clean Specs Section */}
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Clean Product Specifications</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Remove informational content (buying guides, how-tos, customer support) and rename <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">__bullet__</code> keys from product specifications and FAQs.
          </p>
          
          <div className="space-y-4">
            {/* Dry Run Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="cleanSpecsDryRun"
                checked={cleanSpecsDryRun}
                onChange={(e) => setCleanSpecsDryRun(e.target.checked)}
                disabled={loading === 'Clean Specs'}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="cleanSpecsDryRun" className="text-sm text-gray-700 cursor-pointer">
                Dry run (preview changes without applying)
              </label>
            </div>

            {/* Limit Input */}
            <div className="flex items-center gap-3">
              <label htmlFor="cleanSpecsLimit" className="text-sm font-medium text-gray-700 w-32">
                Product Limit:
              </label>
              <input
                type="number"
                id="cleanSpecsLimit"
                value={cleanSpecsLimit}
                onChange={(e) => setCleanSpecsLimit(Math.max(1, parseInt(e.target.value) || 1000))}
                disabled={loading === 'Clean Specs'}
                min="1"
                max="10000"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <span className="text-xs text-gray-500">(max 10,000)</span>
            </div>

            {/* Clean Button */}
            <button
              onClick={handleCleanSpecs}
              disabled={loading === 'Clean Specs'}
              className="w-full px-4 py-3 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium"
            >
              {loading === 'Clean Specs' ? 'Cleaning…' : cleanSpecsDryRun ? 'Preview Cleanup' : 'Clean All Specs'}
            </button>

            {/* Progress */}
            {loading === 'Clean Specs' && progress['Clean Specs'] && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{progress['Clean Specs'].status}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ 
                      width: progress['Clean Specs'].total > 0 
                        ? `${(progress['Clean Specs'].current / progress['Clean Specs'].total) * 100}%`
                        : '50%'
                    }}
                  ></div>
                </div>
              </div>
            )}

            {/* Results */}
            {cleanSpecsResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Results:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Products:</span>
                    <span className="font-medium">{cleanSpecsResult.summary?.totalProducts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Products Modified:</span>
                    <span className="font-medium text-blue-600">{cleanSpecsResult.summary?.cleanedProducts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items Removed:</span>
                    <span className="font-medium text-red-600">{cleanSpecsResult.summary?.totalRemoved || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Specs Renamed:</span>
                    <span className="font-medium text-purple-600">{cleanSpecsResult.summary?.totalRenamed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">FAQs Added:</span>
                    <span className="font-medium text-green-600">{cleanSpecsResult.summary?.totalFAQsAdded || 0}</span>
                  </div>
                  {cleanSpecsDryRun && cleanSpecsResult.detailedChanges && cleanSpecsResult.detailedChanges.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <p className="text-xs text-gray-500 mb-2">Sample changes (first 5):</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {cleanSpecsResult.detailedChanges.slice(0, 5).map((change: any, idx: number) => (
                          <div key={idx} className="text-xs bg-white p-2 rounded border border-gray-200">
                            <p className="font-medium text-gray-900">{change.productName}</p>
                            {change.changes.renamedItems && change.changes.renamedItems.length > 0 && (
                              <p className="text-purple-600 mt-1">
                                Renamed: {change.changes.renamedItems.slice(0, 2).join(', ')}
                              </p>
                            )}
                            {change.changes.specsRemoved && change.changes.specsRemoved.length > 0 && (
                              <p className="text-red-600 mt-1">
                                Removed: {change.changes.specsRemoved.slice(0, 2).join(', ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Remove Brand Name Section */}
        <div className="space-y-3 border-t pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Remove Brand Name from Products</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Remove <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">Everstylecrafts</code> from product titles and tags across all products in the database.
          </p>
          
          <button
            onClick={handleRemoveBrandName}
            disabled={loading === 'Remove Brand Name'}
            className="w-full px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
          >
            {loading === 'Remove Brand Name' ? 'Removing…' : 'Remove Brand Name from All Products'}
          </button>

          {/* Progress */}
          {loading === 'Remove Brand Name' && progress['Remove Brand Name'] && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{progress['Remove Brand Name'].status}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ 
                    width: progress['Remove Brand Name'].total > 0 
                      ? `${(progress['Remove Brand Name'].current / progress['Remove Brand Name'].total) * 100}%`
                      : '50%'
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Results */}
          {removeBrandResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3">Results:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Products:</span>
                  <span className="font-medium">{removeBrandResult.summary?.totalProducts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Products Updated:</span>
                  <span className="font-medium text-blue-600">{removeBrandResult.summary?.updatedProducts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Names Updated:</span>
                  <span className="font-medium text-green-600">{removeBrandResult.summary?.namesUpdated || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tags Updated:</span>
                  <span className="font-medium text-purple-600">{removeBrandResult.summary?.tagsUpdated || 0}</span>
                </div>
                {removeBrandResult.updatedProducts && removeBrandResult.updatedProducts.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <p className="text-xs text-gray-500 mb-2">Sample of updated products (first 10):</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {removeBrandResult.updatedProducts.slice(0, 10).map((product: any, idx: number) => (
                        <div key={idx} className="text-xs bg-white p-2 rounded border border-gray-200">
                          <p className="font-medium text-gray-900">{product.productName}</p>
                          {product.changes && product.changes.length > 0 && (
                            <div className="mt-1 space-y-0.5">
                              {product.changes.slice(0, 2).map((change: string, changeIdx: number) => (
                                <p key={changeIdx} className="text-gray-600 text-xs">{change}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {user?.role?.name === 'SUPER_ADMIN' && (
        <div className="mt-10 bg-white border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileCode2 className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="text-xl font-semibold">Script Runner</h2>
              <p className="text-sm text-gray-500">Execute maintenance scripts directly from the admin panel.</p>
            </div>
          </div>

          {scriptsLoading && (
            <p className="text-sm text-gray-500">Loading scripts…</p>
          )}

          {scriptsError && (
            <p className="text-sm text-red-500">{scriptsError}</p>
          )}

          {!scriptsLoading && !scriptsError && scripts.length === 0 && (
            <p className="text-sm text-gray-500">No scripts found in the <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">scripts/</code> directory.</p>
          )}

          <div className="space-y-6">
            {scripts.map((script) => (
              <div key={script.file} className="border rounded-lg p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{script.name}</h3>
                    <p className="text-sm text-gray-500">{script.description || 'No description provided.'}</p>
                    <p className="text-xs text-gray-400 mt-1">File: scripts/{script.file}</p>
                  </div>
                  <button
                    onClick={() => handleRunScript(script.file)}
                    disabled={activeScript !== null}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    {activeScript === script.file ? 'Running…' : 'Run Script'}
                  </button>
                </div>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="text-sm text-gray-600 sm:w-48">Arguments (optional)</label>
                  <input
                    type="text"
                    value={scriptArgs[script.file] ?? ''}
                    onChange={(event) => setScriptArgs(prev => ({ ...prev, [script.file]: event.target.value }))}
                    placeholder="e.g. --limit 100"
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    disabled={activeScript !== null}
                  />
                </div>

                {scriptOutputs[script.file] && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>Exit code: {scriptOutputs[script.file].exitCode}</span>
                      <button
                        onClick={() => {
                          const textToCopy = scriptOutputs[script.file].stdout || scriptOutputs[script.file].stderr || '';
                          if (typeof window !== 'undefined' && navigator?.clipboard) {
                            navigator.clipboard.writeText(textToCopy).then(() => {
                              toast.success('Output copied to clipboard');
                            }).catch(() => {
                              toast.error('Failed to copy output');
                            });
                          } else {
                            toast.error('Clipboard access is not available');
                          }
                        }}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        Copy output
                      </button>
                    </div>
                    {scriptOutputs[script.file].stdout && (
                      <pre className="bg-gray-900 text-gray-100 text-xs rounded-md p-3 overflow-auto max-h-60">
                        {scriptOutputs[script.file].stdout}
                      </pre>
                    )}
                    {scriptOutputs[script.file].stderr && (
                      <pre className="bg-red-900/80 text-red-100 text-xs rounded-md p-3 overflow-auto max-h-60 mt-3">
                        {scriptOutputs[script.file].stderr}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {user && user.role?.name !== 'SUPER_ADMIN' && (
        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-amber-900">Limited Access</h2>
          <p className="text-sm text-amber-800 mt-2">
            Script execution is restricted to super administrators. Contact a super admin if you need a script to be run.
          </p>
        </div>
      )}
    </div>
  );
}
