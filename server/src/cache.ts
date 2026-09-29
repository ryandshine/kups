interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  staleUntil: number;
  isFetching?: boolean;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Get or set cache with Stale-While-Revalidate (SWR) and in-flight promise deduplication.
 * @param key Unique cache key
 * @param ttlSeconds Seconds the cached value is considered completely fresh
 * @param fetcher Async function to fetch data
 * @param swrSeconds Optional seconds to serve stale data while revalidating in background (default: ttlSeconds * 2)
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  swrSeconds?: number
): Promise<T> {
  const now = Date.now();
  const entry = memoryCache.get(key);
  const swrDuration = (swrSeconds ?? ttlSeconds * 2) * 1000;

  // 1. Fresh cache hit: return immediately
  if (entry && entry.expiresAt > now) {
    return entry.data;
  }

  // 2. Stale cache hit (within SWR window): return stale data immediately and refresh in background
  if (entry && entry.staleUntil > now) {
    if (!entry.isFetching && !inFlightRequests.has(key)) {
      entry.isFetching = true;
      const refreshPromise = fetcher()
        .then((fresh) => {
          memoryCache.set(key, {
            data: fresh,
            expiresAt: Date.now() + ttlSeconds * 1000,
            staleUntil: Date.now() + ttlSeconds * 1000 + swrDuration,
            isFetching: false,
          });
          return fresh;
        })
        .catch((err) => {
          console.error(`[Cache Background Revalidate Error for ${key}]:`, err);
          if (entry) entry.isFetching = false;
        })
        .finally(() => {
          inFlightRequests.delete(key);
        });

      inFlightRequests.set(key, refreshPromise);
    }
    return entry.data;
  }

  // 3. Cache miss: check if an identical fetch is already in flight (deduplicate)
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!;
  }

  // 4. Cache miss & not in-flight: execute fetcher and deduplicate
  const fetchPromise = (async () => {
    try {
      const fresh = await fetcher();
      const currentNow = Date.now();
      memoryCache.set(key, {
        data: fresh,
        expiresAt: currentNow + ttlSeconds * 1000,
        staleUntil: currentNow + ttlSeconds * 1000 + swrDuration,
        isFetching: false,
      });
      return fresh;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, fetchPromise);
  return fetchPromise;
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}
