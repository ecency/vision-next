import { describe, it, expect } from 'vitest'
import { getYoutubeEmbedUrl } from '../getYoutubeEmbedUrl'

describe('getYoutubeEmbedUrl', () => {
  describe('standard youtube URLs', () => {
    it('should convert standard watch URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1')
    })

    it('should handle youtu.be short URLs', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1')
    })

    it('should handle shorts URLs', () => {
      const url = 'https://www.youtube.com/shorts/dQw4w9WgXcQ'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1')
    })

    it('should handle embed URLs', () => {
      const url = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1')
    })
  })

  describe('time parameters', () => {
    it('should preserve t parameter', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?start=42&rel=0&modestbranding=1')
    })

    it('should preserve start parameter', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&start=100'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?start=100&rel=0&modestbranding=1')
    })

    it('should preserve time_continue parameter', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&time_continue=200'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?start=200&rel=0&modestbranding=1')
    })

    it('should parse time format with hours, minutes, and seconds', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1h2m3s'
      const result = getYoutubeEmbedUrl(url)
      // 1h = 3600s, 2m = 120s, 3s = 3s => 3723s
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?start=3723&rel=0&modestbranding=1')
    })

    it('should parse time format with only minutes and seconds', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=5m30s'
      const result = getYoutubeEmbedUrl(url)
      // 5m = 300s, 30s = 30s => 330s
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?start=330&rel=0&modestbranding=1')
    })

    it('should parse time format with only seconds', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45s'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?start=45&rel=0&modestbranding=1')
    })
  })

  describe('playlist parameters', () => {
    it('should preserve list parameter', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toContain('list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf')
      expect(result).toContain('rel=0')
      expect(result).toContain('modestbranding=1')
    })

    it('should handle playlist and time parameters together', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest&t=100'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toContain('start=100')
      expect(result).toContain('list=PLtest')
      expect(result).toContain('rel=0')
      expect(result).toContain('modestbranding=1')
    })
  })

  describe('edge cases', () => {
    it('should return empty string for invalid URL', () => {
      const url = 'not-a-valid-url'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toBe('')
    })

    it('should return empty string when video ID is missing', () => {
      const url = 'https://www.youtube.com/watch'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toBe('')
    })

    it('should return empty string for empty string input', () => {
      const result = getYoutubeEmbedUrl('')
      expect(result).toBe('')
    })

    it('should handle URLs with extra parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=share&other=param'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1')
    })
  })

  describe('default parameters', () => {
    it('should always include rel=0 parameter', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toContain('rel=0')
    })

    it('should always include modestbranding=1 parameter', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      const result = getYoutubeEmbedUrl(url)
      expect(result).toContain('modestbranding=1')
    })
  })
})
