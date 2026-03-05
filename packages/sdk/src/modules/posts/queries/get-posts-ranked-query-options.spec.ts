import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPostsRankedInfiniteQueryOptions, getPostsRankedQueryOptions } from './get-posts-ranked-query-options'
import { CONFIG } from '@/modules/core'

const mockGetPostsRanked = vi.hoisted(() => vi.fn());

vi.mock('@/modules/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/core')>()
  return {
    ...actual,
    CONFIG: {
      ...actual.CONFIG,
      hiveClient: { call: vi.fn() },
      dmcaTagRegexes: []
    }
  }
})

vi.mock('@/modules/bridge', () => ({
  getPostsRanked: mockGetPostsRanked
}))

vi.mock('../utils/filter-dmca-entries', () => ({
  filterDmcaEntry: vi.fn((entries) => entries)
}))

describe('getPostsRankedInfiniteQueryOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return [] when pageParam.hasNextPage is false', async () => {
    const options = getPostsRankedInfiniteQueryOptions('created', 'hive')
    const result = await options.queryFn({
      pageParam: { author: undefined, permlink: undefined, hasNextPage: false },
      meta: undefined as any,
      direction: 'forward',
      queryKey: options.queryKey,
      signal: new AbortController().signal
    })
    expect(result).toEqual([])
  })

  it('should return [] when RPC returns null', async () => {
    vi.mocked(CONFIG.hiveClient.call).mockResolvedValue(null)

    const options = getPostsRankedInfiniteQueryOptions('created', 'hive')
    const result = await options.queryFn({
      pageParam: { author: undefined, permlink: undefined, hasNextPage: true },
      meta: undefined as any,
      direction: 'forward',
      queryKey: options.queryKey,
      signal: new AbortController().signal
    })

    expect(result).toEqual([])
  })

  it('should throw when RPC returns non-null non-array', async () => {
    vi.mocked(CONFIG.hiveClient.call).mockResolvedValue('unexpected')

    const options = getPostsRankedInfiniteQueryOptions('created', 'hive')
    await expect(options.queryFn({
      pageParam: { author: undefined, permlink: undefined, hasNextPage: true },
      meta: undefined as any,
      direction: 'forward',
      queryKey: options.queryKey,
      signal: new AbortController().signal
    })).rejects.toThrow('[SDK] get_ranked_posts returned string')
  })

  it('should return sorted and filtered entries on success', async () => {
    const mockEntries = [
      { author: 'a', permlink: 'p1', created: '2026-01-02T00:00:00', stats: null },
      { author: 'b', permlink: 'p2', created: '2026-01-01T00:00:00', stats: null }
    ]
    vi.mocked(CONFIG.hiveClient.call).mockResolvedValue(mockEntries)

    const options = getPostsRankedInfiniteQueryOptions('created', 'hive')
    const result = await options.queryFn({
      pageParam: { author: undefined, permlink: undefined, hasNextPage: true },
      meta: undefined as any,
      direction: 'forward',
      queryKey: options.queryKey,
      signal: new AbortController().signal
    })

    expect(result).toHaveLength(2)
    // Sorted by created desc
    expect(result[0].author).toBe('a')
  })

  it('should propagate network errors', async () => {
    vi.mocked(CONFIG.hiveClient.call).mockRejectedValue(new Error('network'))

    const options = getPostsRankedInfiniteQueryOptions('created', 'hive')
    await expect(options.queryFn({
      pageParam: { author: undefined, permlink: undefined, hasNextPage: true },
      meta: undefined as any,
      direction: 'forward',
      queryKey: options.queryKey,
      signal: new AbortController().signal
    })).rejects.toThrow('network')
  })
})

describe('getPostsRankedQueryOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call getPostsRanked and return filtered results', async () => {
    const mockEntries = [{ author: 'a', permlink: 'p1' }]
    mockGetPostsRanked.mockResolvedValue(mockEntries)

    const options = getPostsRankedQueryOptions('created', '', '', 20, 'hive', 'obs')
    const result = await options.queryFn()

    expect(mockGetPostsRanked).toHaveBeenCalledWith('created', '', '', 20, 'hive', 'obs')
    expect(result).toEqual(mockEntries)
  })

  it('should return [] when getPostsRanked returns null', async () => {
    mockGetPostsRanked.mockResolvedValue(null)

    const options = getPostsRankedQueryOptions('created')
    const result = await options.queryFn()

    expect(result).toEqual([])
  })

  it('should propagate errors from getPostsRanked', async () => {
    mockGetPostsRanked.mockRejectedValue(new Error('timeout'))

    const options = getPostsRankedQueryOptions('created')
    await expect(options.queryFn()).rejects.toThrow('timeout')
  })
})
