import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validatePostCreating } from './validate-post-creating'

const mockCallRPC = vi.hoisted(() => vi.fn());

vi.mock('@/modules/core/hive-tx', () => ({
  callRPC: mockCallRPC,
}))

describe('validatePostCreating', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('successful validation', () => {
    it('should return immediately when post is found on first attempt', async () => {
      const mockEntry = { author: 'testuser', permlink: 'test-post' }
      mockCallRPC.mockResolvedValue(mockEntry)

      const promise = validatePostCreating('testuser', 'test-post')
      await promise

      expect(mockCallRPC).toHaveBeenCalledTimes(1)
      expect(mockCallRPC).toHaveBeenCalledWith(
        'condenser_api.get_content',
        ['testuser', 'test-post']
      )
    })

    it('should return when post is found on second attempt', async () => {
      mockCallRPC
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ author: 'testuser', permlink: 'test-post' })

      const promise = validatePostCreating('testuser', 'test-post')

      // Advance timer for first delay
      await vi.advanceTimersByTimeAsync(3000)
      await promise

      expect(mockCallRPC).toHaveBeenCalledTimes(2)
    })

    it('should return when post is found on third attempt', async () => {
      mockCallRPC
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ author: 'testuser', permlink: 'test-post' })

      const promise = validatePostCreating('testuser', 'test-post')

      await vi.advanceTimersByTimeAsync(3000)
      await vi.advanceTimersByTimeAsync(3000)
      await promise

      expect(mockCallRPC).toHaveBeenCalledTimes(3)
    })
  })

  describe('timeout behavior', () => {
    it('should stop after max attempts when post not found', async () => {
      mockCallRPC.mockResolvedValue(undefined)

      const promise = validatePostCreating('testuser', 'test-post')

      // Advance through all 3 default delays
      await vi.advanceTimersByTimeAsync(3000)
      await vi.advanceTimersByTimeAsync(3000)
      await vi.advanceTimersByTimeAsync(3000)
      await promise

      // Should be called 4 times total (initial + 3 retries)
      expect(mockCallRPC).toHaveBeenCalledTimes(4)
    })

    it('should respect custom delay configuration', async () => {
      mockCallRPC.mockResolvedValue(undefined)

      const customDelays = [1000, 2000, 4000]
      const promise = validatePostCreating('testuser', 'test-post', 0, { delays: customDelays })

      await vi.advanceTimersByTimeAsync(1000)
      await vi.advanceTimersByTimeAsync(2000)
      await vi.advanceTimersByTimeAsync(4000)
      await promise

      expect(mockCallRPC).toHaveBeenCalledTimes(4)
    })

    it('should handle zero delays', async () => {
      mockCallRPC.mockResolvedValue(undefined)

      const promise = validatePostCreating('testuser', 'test-post', 0, { delays: [0, 0, 0] })
      await promise

      expect(mockCallRPC).toHaveBeenCalledTimes(4)
    })

    it('should handle single delay', async () => {
      mockCallRPC.mockResolvedValue(undefined)

      const promise = validatePostCreating('testuser', 'test-post', 0, { delays: [1000] })

      await vi.advanceTimersByTimeAsync(1000)
      await promise

      expect(mockCallRPC).toHaveBeenCalledTimes(2)
    })
  })

  describe('error handling', () => {
    it('should retry on API errors', async () => {
      mockCallRPC
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ author: 'testuser', permlink: 'test-post' })

      const promise = validatePostCreating('testuser', 'test-post')

      await vi.advanceTimersByTimeAsync(3000)
      await promise

      expect(mockCallRPC).toHaveBeenCalledTimes(2)
    })

    it('should stop after max attempts even with continuous errors', async () => {
      mockCallRPC.mockRejectedValue(new Error('Persistent error'))

      const promise = validatePostCreating('testuser', 'test-post')

      await vi.advanceTimersByTimeAsync(3000)
      await vi.advanceTimersByTimeAsync(3000)
      await vi.advanceTimersByTimeAsync(3000)
      await promise

      expect(mockCallRPC).toHaveBeenCalledTimes(4)
    })
  })

  describe('internal attempt tracking', () => {
    it('should use provided attempts parameter', async () => {
      mockCallRPC.mockResolvedValue(undefined)

      // Start at attempt 2 (meaning only 1 more retry left with default 3 delays)
      const promise = validatePostCreating('testuser', 'test-post', 2, { delays: [100, 100, 100] })

      await vi.advanceTimersByTimeAsync(100)
      await promise

      // Should only call twice (attempt 2 + attempt 3)
      expect(mockCallRPC).toHaveBeenCalledTimes(2)
    })

    it('should stop immediately if attempts equals delays length', async () => {
      mockCallRPC.mockResolvedValue(undefined)

      const promise = validatePostCreating('testuser', 'test-post', 3, { delays: [100, 100, 100] })
      await promise

      // Should only call once since we're already at max attempts
      expect(mockCallRPC).toHaveBeenCalledTimes(1)
    })
  })

  describe('edge cases', () => {
    it('should handle empty author', async () => {
      mockCallRPC.mockResolvedValue(undefined)

      const promise = validatePostCreating('', 'test-post')

      // Advance timers through all delays
      await vi.advanceTimersByTimeAsync(3000)
      await vi.advanceTimersByTimeAsync(3000)
      await vi.advanceTimersByTimeAsync(3000)
      await promise

      expect(mockCallRPC).toHaveBeenCalledWith(
        'condenser_api.get_content',
        ['', 'test-post']
      )
    })

    it('should handle empty permlink', async () => {
      mockCallRPC.mockResolvedValue(undefined)

      const promise = validatePostCreating('testuser', '')

      // Advance timers through all delays
      await vi.advanceTimersByTimeAsync(3000)
      await vi.advanceTimersByTimeAsync(3000)
      await vi.advanceTimersByTimeAsync(3000)
      await promise

      expect(mockCallRPC).toHaveBeenCalledWith(
        'condenser_api.get_content',
        ['testuser', '']
      )
    })

    it('should handle special characters in author/permlink', async () => {
      mockCallRPC.mockResolvedValue({ author: 'test-user', permlink: 'test-post-123' })

      await validatePostCreating('test-user', 'test-post-123')

      expect(mockCallRPC).toHaveBeenCalledWith(
        'condenser_api.get_content',
        ['test-user', 'test-post-123']
      )
    })
  })
})
