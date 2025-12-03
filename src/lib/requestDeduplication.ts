/**
 * Request Deduplication Utility
 * Prevents duplicate API calls from happening simultaneously
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly CACHE_DURATION = 5000; // 5 seconds cache for identical requests

  /**
   * Deduplicate a request - if the same request is already in flight, return the existing promise
   * For Response objects, clones them so multiple callers can read the body
   */
  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    useCache: boolean = true
  ): Promise<T> {
    const now = Date.now();
    
    // Check if there's a pending request (atomic check)
    let pending = this.pendingRequests.get(key);
    
    if (pending) {
      // If request is recent (within cache duration), return cached promise
      if (useCache && (now - pending.timestamp) < this.CACHE_DURATION) {
        console.log(`[RequestDeduplicator] Reusing pending request for: ${key}`);
        const result = await pending.promise;
        
        // If it's a Response object, clone it so the body can be read multiple times
        // This is critical because Response body streams can only be read once
        if (result && typeof result === 'object' && 'clone' in result && typeof (result as any).clone === 'function') {
          return (result as Response).clone() as T;
        }
        
        return result as T;
      }
      
      // If request is stale, remove it
      if (now - pending.timestamp >= this.CACHE_DURATION) {
        this.pendingRequests.delete(key);
        pending = undefined;
      }
    }

    // Double-check after potential deletion (race condition protection)
    if (!pending) {
      pending = this.pendingRequests.get(key);
      if (pending && useCache && (now - pending.timestamp) < this.CACHE_DURATION) {
        console.log(`[RequestDeduplicator] Reusing pending request for: ${key} (after double-check)`);
        const result = await pending.promise;
        
        if (result && typeof result === 'object' && 'clone' in result && typeof (result as any).clone === 'function') {
          return (result as Response).clone() as T;
        }
        
        return result as T;
      }
    }

    // Create new request
    const promise = requestFn()
      .then((result) => {
        // Remove from pending after completion (only if this is still the current request)
        const currentPending = this.pendingRequests.get(key);
        if (currentPending && currentPending.promise === promise) {
          this.pendingRequests.delete(key);
        }
        return result;
      })
      .catch((error) => {
        // Remove from pending on error (only if this is still the current request)
        const currentPending = this.pendingRequests.get(key);
        if (currentPending && currentPending.promise === promise) {
          this.pendingRequests.delete(key);
        }
        throw error;
      });

    // Store pending request (overwrite any existing one)
    this.pendingRequests.set(key, {
      promise,
      timestamp: now
    });

    return promise;
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  clear() {
    this.pendingRequests.clear();
  }

  /**
   * Clear stale requests (older than cache duration)
   */
  clearStale() {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp >= this.CACHE_DURATION) {
        this.pendingRequests.delete(key);
      }
    }
  }
}

// Singleton instance
export const requestDeduplicator = new RequestDeduplicator();

// Cleanup stale requests every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestDeduplicator.clearStale();
  }, 60000); // Every minute
}

