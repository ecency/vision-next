import { cacheGet, cacheSet, setCacheSize } from './cache'

describe('Cache utilities', () => {
  beforeEach(() => {
    // Reset cache to default size before each test
    setCacheSize(60)
  })

  describe('cacheSet()', () => {
    it('should store string values', () => {
      cacheSet('key1', 'value1')
      const result = cacheGet<string>('key1')

      expect(result).toBe('value1')
    })

    it('should store number values', () => {
      cacheSet('key2', 12345)
      const result = cacheGet<number>('key2')

      expect(result).toBe(12345)
    })

    it('should store object values', () => {
      const obj = { name: 'test', value: 42 }
      cacheSet('key3', obj)
      const result = cacheGet<typeof obj>('key3')

      expect(result).toEqual(obj)
    })

    it('should store array values', () => {
      const arr = [1, 2, 3, 4, 5]
      cacheSet('key4', arr)
      const result = cacheGet<number[]>('key4')

      expect(result).toEqual(arr)
    })

    it('should store boolean values', () => {
      cacheSet('key5', true)
      const result = cacheGet<boolean>('key5')

      expect(result).toBe(true)
    })

    it('should overwrite existing values', () => {
      cacheSet('key6', 'first')
      cacheSet('key6', 'second')
      const result = cacheGet<string>('key6')

      expect(result).toBe('second')
    })

    it('should store null values', () => {
      cacheSet('key7', null)
      const result = cacheGet<null>('key7')

      expect(result).toBeNull()
    })

    it('should store undefined values', () => {
      cacheSet('key8', undefined)
      const result = cacheGet<undefined>('key8')

      expect(result).toBeUndefined()
    })
  })

  describe('cacheGet()', () => {
    it('should retrieve stored values', () => {
      cacheSet('retrieve1', 'test value')
      const result = cacheGet<string>('retrieve1')

      expect(result).toBe('test value')
    })

    it('should return undefined for non-existent keys', () => {
      const result = cacheGet<string>('nonexistent')

      expect(result).toBeUndefined()
    })

    it('should retrieve recently set values', () => {
      cacheSet('recent', 'recent value')
      const result = cacheGet<string>('recent')

      expect(result).toBe('recent value')
    })

    it('should retrieve complex objects', () => {
      const complex = {
        id: 1,
        nested: {
          prop: 'value',
          arr: [1, 2, 3]
        }
      }
      cacheSet('complex', complex)
      const result = cacheGet<typeof complex>('complex')

      expect(result).toEqual(complex)
      expect(result.nested.prop).toBe('value')
      expect(result.nested.arr).toEqual([1, 2, 3])
    })
  })

  describe('setCacheSize()', () => {
    it('should allow setting custom cache size', () => {
      setCacheSize(10)

      // Add 10 items
      for (let i = 0; i < 10; i++) {
        cacheSet(`item${i}`, `value${i}`)
      }

      // All should be retrievable
      expect(cacheGet<string>('item0')).toBe('value0')
      expect(cacheGet<string>('item9')).toBe('value9')
    })

    it('should evict oldest items when cache is full', () => {
      setCacheSize(3)

      cacheSet('first', 1)
      cacheSet('second', 2)
      cacheSet('third', 3)
      cacheSet('fourth', 4) // This should evict 'first'

      expect(cacheGet<number>('first')).toBeUndefined()
      expect(cacheGet<number>('second')).toBe(2)
      expect(cacheGet<number>('third')).toBe(3)
      expect(cacheGet<number>('fourth')).toBe(4)
    })

    it('should maintain LRU eviction policy', () => {
      setCacheSize(3)

      cacheSet('a', 'A')
      cacheSet('b', 'B')
      cacheSet('c', 'C')

      // Access 'a' to make it recently used
      cacheGet('a')

      // Add new item, should evict 'b' (least recently used)
      cacheSet('d', 'D')

      expect(cacheGet<string>('a')).toBe('A') // Still there
      expect(cacheGet<string>('b')).toBeUndefined() // Evicted
      expect(cacheGet<string>('c')).toBe('C') // Still there
      expect(cacheGet<string>('d')).toBe('D') // Newly added
    })

    it('should allow increasing cache size', () => {
      setCacheSize(2)
      cacheSet('item1', 'value1')
      cacheSet('item2', 'value2')

      // Increase size - note this creates a new cache, so old items are lost
      setCacheSize(10)

      // Should be able to add more items to the new larger cache
      for (let i = 1; i <= 10; i++) {
        cacheSet(`item${i}`, `value${i}`)
      }

      // All items should be accessible in the new cache
      expect(cacheGet<string>('item1')).toBe('value1')
      expect(cacheGet<string>('item10')).toBe('value10')
    })

    it('should handle setting size to 1', () => {
      setCacheSize(1)

      cacheSet('only', 'one')
      expect(cacheGet<string>('only')).toBe('one')

      cacheSet('another', 'two')
      expect(cacheGet<string>('only')).toBeUndefined()
      expect(cacheGet<string>('another')).toBe('two')
    })
  })

  describe('cache eviction behavior', () => {
    it('should evict least recently used items when max size reached', () => {
      setCacheSize(5)

      // Fill cache
      for (let i = 0; i < 5; i++) {
        cacheSet(`key${i}`, `value${i}`)
      }

      // Add one more, should evict first one
      cacheSet('key5', 'value5')

      expect(cacheGet<string>('key0')).toBeUndefined()
      expect(cacheGet<string>('key4')).toBe('value4')
      expect(cacheGet<string>('key5')).toBe('value5')
    })

    it('should handle rapid cache updates', () => {
      setCacheSize(3)

      for (let i = 0; i < 10; i++) {
        cacheSet(`rapid${i}`, i)
      }

      // Only last 3 should remain
      expect(cacheGet<number>('rapid7')).toBe(7)
      expect(cacheGet<number>('rapid8')).toBe(8)
      expect(cacheGet<number>('rapid9')).toBe(9)
      expect(cacheGet<number>('rapid0')).toBeUndefined()
    })
  })

  describe('type safety', () => {
    it('should handle typed retrieval', () => {
      interface User {
        id: number
        name: string
      }

      const user: User = { id: 1, name: 'Alice' }
      cacheSet('user', user)

      const retrieved = cacheGet<User>('user')

      expect(retrieved).toEqual(user)
      expect(retrieved.id).toBe(1)
      expect(retrieved.name).toBe('Alice')
    })

    it('should handle union types', () => {
      type Value = string | number | boolean

      cacheSet('union1', 'string')
      cacheSet('union2', 123)
      cacheSet('union3', true)

      expect(cacheGet<Value>('union1')).toBe('string')
      expect(cacheGet<Value>('union2')).toBe(123)
      expect(cacheGet<Value>('union3')).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle very long keys', () => {
      const longKey = 'k'.repeat(1000)
      cacheSet(longKey, 'value')

      expect(cacheGet<string>(longKey)).toBe('value')
    })

    it('should handle special characters in keys', () => {
      const specialKey = '!@#$%^&*()_+-=[]{}|;:,.<>?'
      cacheSet(specialKey, 'special')

      expect(cacheGet<string>(specialKey)).toBe('special')
    })

    it('should handle empty string as key', () => {
      cacheSet('', 'empty key')

      expect(cacheGet<string>('')).toBe('empty key')
    })

    it('should handle unicode keys', () => {
      cacheSet('🔑', '🎉')

      expect(cacheGet<string>('🔑')).toBe('🎉')
    })

    it('should handle very large cache sizes', () => {
      setCacheSize(1000)

      for (let i = 0; i < 100; i++) {
        cacheSet(`large${i}`, i)
      }

      expect(cacheGet<number>('large0')).toBe(0)
      expect(cacheGet<number>('large99')).toBe(99)
    })

    it('should throw on invalid cache sizes', () => {
      // LRU cache requires at least max or maxSize to be set and > 0
      expect(() => setCacheSize(0)).toThrow()
      expect(() => setCacheSize(-1)).toThrow()
    })
  })

  describe('performance scenarios', () => {
    it('should handle frequent get/set operations', () => {
      setCacheSize(50)

      const operations = 1000
      for (let i = 0; i < operations; i++) {
        const key = `perf${i % 50}`
        cacheSet(key, i)
        cacheGet(key)
      }

      // Should complete without errors
      expect(cacheGet<number>('perf49')).toBeDefined()
    })

    it('should maintain correct values under concurrent-like access patterns', () => {
      setCacheSize(10)

      // Simulate multiple keys being updated
      for (let round = 0; round < 5; round++) {
        for (let i = 0; i < 10; i++) {
          cacheSet(`key${i}`, round * 10 + i)
        }
      }

      // Last round values should be present
      expect(cacheGet<number>('key0')).toBe(40)
      expect(cacheGet<number>('key9')).toBe(49)
    })
  })

  describe('real-world usage patterns', () => {
    it('should cache rendered HTML strings', () => {
      const html = '<div class="content"><p>Rendered content</p></div>'
      cacheSet('post-123-html', html)

      const cached = cacheGet<string>('post-123-html')
      expect(cached).toBe(html)
    })

    it('should cache parsed markdown results', () => {
      const markdown = { html: '<h1>Title</h1>', metadata: { title: 'Title' } }
      cacheSet('md-cache-456', markdown)

      const result = cacheGet<typeof markdown>('md-cache-456')
      expect(result.html).toBe('<h1>Title</h1>')
      expect(result.metadata.title).toBe('Title')
    })

    it('should handle entry cache keys', () => {
      const entry = {
        author: 'alice',
        permlink: 'my-post',
        last_update: '2024-01-01',
        updated: '2024-01-01T00:00:00'
      }
      const cacheKey = `${entry.author}-${entry.permlink}-${entry.last_update}-${entry.updated}`

      cacheSet(cacheKey, '<div>Rendered post</div>')

      const cached = cacheGet<string>(cacheKey)
      expect(cached).toBe('<div>Rendered post</div>')
    })
  })
})
