/**
 * Simple in-memory rate limiter for API endpoints
 * Tracks requests by IP address and enforces configurable limits
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

class RateLimiter {
    private requests: Map<string, RateLimitEntry> = new Map();
    private windowMs: number;
    private maxRequests: number;

    constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 10) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;

        // Cleanup old entries every 5 minutes
        setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    /**
     * Check if request should be allowed
     * @param identifier - Unique identifier (IP address, user ID, etc.)
     * @returns true if allowed, false if rate limited
     */
    check(identifier: string): boolean {
        const now = Date.now();
        const entry = this.requests.get(identifier);

        if (!entry || now > entry.resetTime) {
            // New window or expired entry
            this.requests.set(identifier, {
                count: 1,
                resetTime: now + this.windowMs,
            });
            return true;
        }

        if (entry.count >= this.maxRequests) {
            // Rate limit exceeded
            return false;
        }

        // Increment count
        entry.count++;
        return true;
    }

    /**
     * Get remaining requests for identifier
     */
    getRemaining(identifier: string): number {
        const entry = this.requests.get(identifier);
        if (!entry || Date.now() > entry.resetTime) {
            return this.maxRequests;
        }
        return Math.max(0, this.maxRequests - entry.count);
    }

    /**
     * Get reset time for identifier
     */
    getResetTime(identifier: string): number | null {
        const entry = this.requests.get(identifier);
        if (!entry || Date.now() > entry.resetTime) {
            return null;
        }
        return entry.resetTime;
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.requests.entries()) {
            if (now > entry.resetTime) {
                this.requests.delete(key);
            }
        }
    }

    /**
     * Reset rate limit for identifier (useful for testing)
     */
    reset(identifier: string): void {
        this.requests.delete(identifier);
    }

    /**
     * Clear all rate limit data
     */
    clear(): void {
        this.requests.clear();
    }
}

// Create rate limiter instances for different endpoints
export const promoValidationLimiter = new RateLimiter(
    15 * 60 * 1000, // 15 minutes
    10 // 10 requests per window
);

export const strictLimiter = new RateLimiter(
    5 * 60 * 1000, // 5 minutes
    5 // 5 requests per window
);

/**
 * Extract client IP from request
 */
export function getClientIp(request: Request): string {
    // Check various headers for IP (works with proxies/load balancers)
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
        return realIp;
    }

    // Fallback to a default (shouldn't happen in production)
    return 'unknown';
}

/**
 * Rate limit middleware helper
 * Returns null if allowed, or a Response object if rate limited
 */
export function checkRateLimit(
    request: Request,
    limiter: RateLimiter = promoValidationLimiter
): Response | null {
    const ip = getClientIp(request);

    if (!limiter.check(ip)) {
        const resetTime = limiter.getResetTime(ip);
        const retryAfter = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60;

        return new Response(
            JSON.stringify({
                error: 'Too many requests. Please try again later.',
                retryAfter,
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': retryAfter.toString(),
                    'X-RateLimit-Limit': limiter['maxRequests'].toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': resetTime?.toString() || '',
                },
            }
        );
    }

    return null;
}
