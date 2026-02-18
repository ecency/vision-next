import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPostQueryOptions } from './get-post-query-options'
import { CONFIG } from '@/modules/core'

// Mock CONFIG
vi.mock('@/modules/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/core')>()
  return {
    ...actual,
    CONFIG: {
      hiveClient: {
        call: vi.fn()
      }
    }
  }
})

// Mock filterDmcaEntry
vi.mock('../utils/filter-dmca-entries', () => ({
  filterDmcaEntry: vi.fn((entry) => entry)
}))

describe('getPostQueryOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('query key generation', () => {
    it('should generate correct query key for author and permlink', () => {
      const options = getPostQueryOptions('testauthor', 'test-permlink')

      expect(options.queryKey).toMatchSnapshot()
      expect(options.queryKey).toEqual(['posts', 'entry', '/@testauthor/test-permlink'])
    })

    it('should handle permlink with spaces', () => {
      const options = getPostQueryOptions('testauthor', '  test-permlink  ')

      expect(options.queryKey).toEqual(['posts', 'entry', '/@testauthor/test-permlink'])
    })

    it('should generate query key with empty category', () => {
      const options = getPostQueryOptions('author', 'permlink')

      expect(options.queryKey[2]).toBe('/@author/permlink')
    })
  })

  describe('enabled conditions', () => {
    it('should be enabled for valid author and permlink', () => {
      const options = getPostQueryOptions('testauthor', 'test-permlink')

      expect(options.enabled).toBe(true)
    })

    it('should be disabled for empty author', () => {
      const options = getPostQueryOptions('', 'test-permlink')

      expect(options.enabled).toBe(false)
    })

    it('should be disabled for undefined permlink', () => {
      const options = getPostQueryOptions('testauthor', undefined)

      expect(options.enabled).toBe(false)
    })

    it('should be disabled for empty permlink', () => {
      const options = getPostQueryOptions('testauthor', '')

      expect(options.enabled).toBe(false)
    })

    it('should be disabled for permlink that trims to empty', () => {
      const options = getPostQueryOptions('testauthor', '   ')

      expect(options.enabled).toBe(false)
    })

    it('should be disabled for permlink "undefined"', () => {
      const options = getPostQueryOptions('testauthor', 'undefined')

      expect(options.enabled).toBe(false)
    })

    it('should be disabled for permlink that trims to "undefined"', () => {
      const options = getPostQueryOptions('testauthor', '  undefined  ')

      expect(options.enabled).toBe(false)
    })
  })

  describe('queryFn behavior', () => {
    it('should return null for empty permlink after trim', async () => {
      const options = getPostQueryOptions('testauthor', '   ')
      const result = await options.queryFn()

      expect(result).toBeNull()
      expect(CONFIG.hiveClient.call).not.toHaveBeenCalled()
    })

    it('should return null for permlink "undefined"', async () => {
      const options = getPostQueryOptions('testauthor', 'undefined')
      const result = await options.queryFn()

      expect(result).toBeNull()
      expect(CONFIG.hiveClient.call).not.toHaveBeenCalled()
    })

    it('should call hive client with correct parameters', async () => {
      const mockResponse = {
        author: 'testauthor',
        permlink: 'test-permlink',
        title: 'Test Post',
        body: 'Test content'
      }
      vi.mocked(CONFIG.hiveClient.call).mockResolvedValue(mockResponse)

      const options = getPostQueryOptions('testauthor', 'test-permlink', 'observer')
      await options.queryFn()

      expect(CONFIG.hiveClient.call).toHaveBeenCalledWith('bridge', 'get_post', {
        author: 'testauthor',
        permlink: 'test-permlink',
        observer: 'observer'
      })
    })

    it('should call hive client with empty observer by default', async () => {
      const mockResponse = { author: 'test', permlink: 'test' }
      vi.mocked(CONFIG.hiveClient.call).mockResolvedValue(mockResponse)

      const options = getPostQueryOptions('testauthor', 'test-permlink')
      await options.queryFn()

      expect(CONFIG.hiveClient.call).toHaveBeenCalledWith('bridge', 'get_post', {
        author: 'testauthor',
        permlink: 'test-permlink',
        observer: ''
      })
    })

    it('should return null when hive client returns null', async () => {
      vi.mocked(CONFIG.hiveClient.call).mockResolvedValue(null)

      const options = getPostQueryOptions('testauthor', 'test-permlink')
      const result = await options.queryFn()

      expect(result).toBeNull()
    })

    it('should add num field when provided', async () => {
      const mockResponse = {
        author: 'testauthor',
        permlink: 'test-permlink'
      }
      vi.mocked(CONFIG.hiveClient.call).mockResolvedValue(mockResponse)

      const options = getPostQueryOptions('testauthor', 'test-permlink', '', 5)
      const result = await options.queryFn()

      expect(result).toBeDefined()
      expect(result?.num).toBe(5)
    })

    it('should not add num field when undefined', async () => {
      const mockResponse = {
        author: 'testauthor',
        permlink: 'test-permlink'
      }
      vi.mocked(CONFIG.hiveClient.call).mockResolvedValue(mockResponse)

      const options = getPostQueryOptions('testauthor', 'test-permlink')
      const result = await options.queryFn()

      expect(result).toBeDefined()
      expect(result).not.toHaveProperty('num')
    })
  })

  describe('edge cases', () => {
    it('should handle special characters in permlink', () => {
      const options = getPostQueryOptions('testauthor', 'test-permlink-123-xyz')

      expect(options.queryKey[2]).toBe('/@testauthor/test-permlink-123-xyz')
    })

    it('should handle unicode in author name', () => {
      const options = getPostQueryOptions('测试用户', 'test-permlink')

      expect(options.queryKey[2]).toContain('测试用户')
    })

    it('should trim leading and trailing whitespace from permlink', () => {
      const options = getPostQueryOptions('author', '  spaced-permlink  ')

      expect(options.queryKey[2]).toBe('/@author/spaced-permlink')
    })
  })
})
