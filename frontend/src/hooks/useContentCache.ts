import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface UseContentCacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

export function useContentCache<T>(options: UseContentCacheOptions = {}) {
  const { ttl = 5 * 60 * 1000, maxSize = 50 } = options; // 5 minutes default TTL
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());

  const isExpired = (entry: CacheEntry<T>) => {
    return Date.now() > entry.expiresAt;
  };

  const cleanup = useCallback(() => {
    setCache(prevCache => {
      const newCache = new Map();
      const now = Date.now();
      
      for (const [key, entry] of Array.from(prevCache.entries())) {
        if (now <= entry.expiresAt) {
          newCache.set(key, entry);
        }
      }
      
      return newCache;
    });
  }, []);

  const get = useCallback((key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;
    
    if (isExpired(entry)) {
      setCache(prevCache => {
        const newCache = new Map(prevCache);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }
    
    return entry.data;
  }, [cache]);

  const set = useCallback((key: string, data: T) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      
      // Remove oldest entries if cache is full
      if (newCache.size >= maxSize) {
        const entries = Array.from(newCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = entries.slice(0, entries.length - maxSize + 1);
        toRemove.forEach(([k]) => newCache.delete(k));
      }
      
      newCache.set(key, {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      });
      
      return newCache;
    });
  }, [ttl, maxSize]);

  const remove = useCallback((key: string) => {
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.delete(key);
      return newCache;
    });
  }, []);

  const clear = useCallback(() => {
    setCache(new Map());
  }, []);

  // Cleanup expired entries every minute
  useEffect(() => {
    const interval = setInterval(cleanup, 60000);
    return () => clearInterval(interval);
  }, [cleanup]);

  return {
    get,
    set,
    remove,
    clear,
    size: cache.size
  };
}


