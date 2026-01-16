import { describe, it, expect } from 'vitest'
import { isWaveLikePost } from '../is-wave-like-post'

describe('isWaveLikePost', () => {
  describe('ecencywaves posts', () => {
    it('should identify re-ecencywaves posts', () => {
      const link = 'https://ecency.com/@user/re-ecencywaves-test'
      expect(isWaveLikePost(link)).toBe(true)
    })

    it('should identify re-ecencywaves with full path', () => {
      const link = 'https://ecency.com/hive-123/@user/re-ecencywaves-12345'
      expect(isWaveLikePost(link)).toBe(true)
    })

    it('should work with relative URLs', () => {
      const link = '/@user/re-ecencywaves-post'
      expect(isWaveLikePost(link)).toBe(true)
    })
  })

  describe('leothreads posts', () => {
    it('should identify re-leothreads posts', () => {
      const link = 'https://ecency.com/@user/re-leothreads-test'
      expect(isWaveLikePost(link)).toBe(true)
    })

    it('should identify re-leothreads with community path', () => {
      const link = 'https://ecency.com/hive-leo/@author/re-leothreads-abc'
      expect(isWaveLikePost(link)).toBe(true)
    })
  })

  describe('wave- prefixed posts', () => {
    it('should identify wave- prefix posts', () => {
      const link = 'https://ecency.com/@user/wave-12345'
      expect(isWaveLikePost(link)).toBe(true)
    })

    it('should identify wave- with timestamp', () => {
      const link = '/@user/wave-1234567890'
      expect(isWaveLikePost(link)).toBe(true)
    })

    it('should identify wave- with descriptive text', () => {
      const link = 'https://ecency.com/@user/wave-my-thought'
      expect(isWaveLikePost(link)).toBe(true)
    })
  })

  describe('liketu moments posts', () => {
    it('should identify re-liketu-moments posts', () => {
      const link = 'https://ecency.com/@user/re-liketu-moments-test'
      expect(isWaveLikePost(link)).toBe(true)
    })

    it('should identify re-liketu-moments with full URL', () => {
      const link = 'https://peakd.com/hive-liketu/@user/re-liketu-moments-12345'
      expect(isWaveLikePost(link)).toBe(true)
    })
  })

  describe('non-wave posts', () => {
    it('should return false for regular posts', () => {
      const link = 'https://ecency.com/@user/my-regular-post'
      expect(isWaveLikePost(link)).toBe(false)
    })

    it('should return false for posts with wave in middle', () => {
      const link = 'https://ecency.com/@user/post-wave-something'
      expect(isWaveLikePost(link)).toBe(false)
    })

    it('should return false for reply posts', () => {
      const link = 'https://ecency.com/@user/re-someuser-post'
      expect(isWaveLikePost(link)).toBe(false)
    })

    it('should return false for community posts', () => {
      const link = 'https://ecency.com/hive-123456/@user/normal-post'
      expect(isWaveLikePost(link)).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should return false for invalid URLs', () => {
      const link = 'not-a-valid-url'
      expect(isWaveLikePost(link)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isWaveLikePost('')).toBe(false)
    })

    it('should return false for URL without permlink', () => {
      const link = 'https://ecency.com/@user'
      expect(isWaveLikePost(link)).toBe(false)
    })

    it('should return false for root URL', () => {
      const link = 'https://ecency.com/'
      expect(isWaveLikePost(link)).toBe(false)
    })

    it('should handle malformed URLs gracefully', () => {
      const link = 'https://ecency.com/@user///'
      expect(isWaveLikePost(link)).toBe(false)
    })
  })

  describe('different domains', () => {
    it('should work with peakd.com', () => {
      const link = 'https://peakd.com/@user/wave-12345'
      expect(isWaveLikePost(link)).toBe(true)
    })

    it('should work with hive.blog', () => {
      const link = 'https://hive.blog/@user/re-ecencywaves-test'
      expect(isWaveLikePost(link)).toBe(true)
    })

    it('should work with relative paths', () => {
      const link = '/@user/re-leothreads-12345'
      expect(isWaveLikePost(link)).toBe(true)
    })
  })
})
