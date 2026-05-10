import { LRUCache } from 'lru-cache'

// A single feed page calls catchPostImage 3× per entry (blur 0×0, grid, row)
// plus postBodySummary, so 20 entries already produce ~80 keys. The previous
// max of 60 caused constant eviction and forced re-rendering of full markdown
// during SSR fan-out.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cache = new LRUCache<string, any>({ max: 500 })

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
