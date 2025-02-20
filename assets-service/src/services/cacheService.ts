import NodeCache from 'node-cache';

class CacheService {
  private cache: NodeCache;

  constructor(ttlSeconds: number = 3600) { // 1 hora por defecto
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
      useClones: false
    });
  }

  get(key: string): any {
    return this.cache.get(key);
  }

  set(key: string, value: any, ttl: number = 3600): boolean {
    return this.cache.set(key, value, ttl);
  }

  delete(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  generateVastKey(adId: string, params: Record<string, string>): string {
    const sortedParams = Object.entries(params)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    return `vast:${adId}:${sortedParams}`;
  }

  stats(): { hits: number; misses: number; keys: number } {
    return this.cache.getStats();
  }
}

export const cacheService = new CacheService(); 