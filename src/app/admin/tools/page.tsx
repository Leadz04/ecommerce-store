'use client';

import { useEffect, useState } from 'react';
import { FileCode2, Play, Wrench } from 'lucide-react';
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
    const headers: HeadersInit = options.headers ? { ...options.headers } : {};
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
