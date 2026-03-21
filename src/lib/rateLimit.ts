/* =============================================
   URBANKA — In-memory Rate Limiter
   IP-based sliding window. Works per server instance.
   For production at scale: replace with Redis/Upstash.
   ============================================= */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Returns true if the request should be blocked.
 * @param key      Unique key (e.g. IP + endpoint)
 * @param limit    Max allowed requests per window
 * @param windowMs Time window in milliseconds
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
        // First request in window or window expired
        store.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }

    if (entry.count >= limit) {
        return true; // Over the limit
    }

    entry.count += 1;
    return false;
}

/** Get the IP address from a Next.js request, with proxy header support */
export function getIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return "unknown";
}
