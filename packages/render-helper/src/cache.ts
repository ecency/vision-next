import { LRUCache } from 'lru-cache'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cache = new LRUCache<string, any>({ max: 60 })

export function setCacheSize(size: number): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cache = new LRUCache<string, any>({ max: size })
}

export function cacheGet<T extends unknown>(key: string): T {
  return cache.get(key) as T
}

export function cacheSet(key: string, value: unknown): void {
  cache.set(key, value)
}
