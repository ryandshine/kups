interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const entry = memoryCache.get(key);

  if (entry && entry.expiresAt > now) {
    return entry.data;
  }

  const fresh = await fetcher();
  memoryCache.set(key, {
    data: fresh,
    expiresAt: now + ttlSeconds * 1000,
  });

  return fresh;
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
