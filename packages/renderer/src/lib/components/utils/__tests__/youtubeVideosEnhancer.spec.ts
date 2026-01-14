import { describe, it, expect, beforeEach, vi } from 'vitest'
import { applyYoutubeVideos } from '../youtubeVideosEnhancer'

// Mock react-dom/client
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
}))

// Mock getYoutubeEmbedUrl
vi.mock('../getYoutubeEmbedUrl', () => ({
  getYoutubeEmbedUrl: vi.fn((url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return `https://www.youtube.com/embed/test-id?rel=0&modestbranding=1`
    }
    return ''
  }),
}))

describe('applyYoutubeVideos', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.classList.add('markdown-view')
    vi.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should enhance YouTube video links', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-video-link-youtube')
      link.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      container.appendChild(link)

      applyYoutubeVideos(container)

      expect(link.dataset.enhanced).toBe('true')
      const wrapper = link.querySelector('.ecency-renderer-youtube-extension-frame')
      expect(wrapper).toBeTruthy()
    })

    it('should set embedSrc from getYoutubeEmbedUrl', async () => {
      const { getYoutubeEmbedUrl } = await import('../getYoutubeEmbedUrl')

      const link = document.createElement('a')
      link.classList.add('markdown-video-link-youtube')
      link.href = 'https://www.youtube.com/watch?v=test123'
      container.appendChild(link)

      applyYoutubeVideos(container)

      expect(getYoutubeEmbedUrl).toHaveBeenCalledWith('https://www.youtube.com/watch?v=test123')
      expect(link.dataset.embedSrc).toBeTruthy()
    })

    it('should use existing data-embed-src if present', async () => {
      const { getYoutubeEmbedUrl } = await import('../getYoutubeEmbedUrl')

      const link = document.createElement('a')
      link.classList.add('markdown-video-link-youtube')
      link.href = 'https://www.youtube.com/watch?v=test123'
      link.dataset.embedSrc = 'https://www.youtube.com/embed/existing-id'
      container.appendChild(link)

      applyYoutubeVideos(container)

      expect(getYoutubeEmbedUrl).not.toHaveBeenCalled()
      expect(link.dataset.embedSrc).toBe('https://www.youtube.com/embed/existing-id')
    })

    it('should append wrapper inside link element', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-video-link-youtube')
      link.href = 'https://www.youtube.com/watch?v=test'
      container.appendChild(link)

      applyYoutubeVideos(container)

      const wrapper = link.querySelector('.ecency-renderer-youtube-extension-frame')
      expect(wrapper).toBeTruthy()
      expect(wrapper?.parentElement).toBe(link)
    })
  })

  describe('filtering', () => {
    it('should skip non-youtube-video-link elements', () => {
      const link = document.createElement('a')
      link.href = 'https://www.youtube.com/watch?v=test'
      container.appendChild(link)

      applyYoutubeVideos(container)

      expect(link.dataset.enhanced).toBeUndefined()
    })

    it('should skip already enhanced links', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-video-link-youtube')
      link.href = 'https://www.youtube.com/watch?v=test'
      link.dataset.enhanced = 'true'
      container.appendChild(link)

      const initialHTML = link.innerHTML

      applyYoutubeVideos(container)

      expect(link.innerHTML).toBe(initialHTML)
    })

    it('should skip links with ecency-renderer-youtube-extension class', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-video-link-youtube', 'ecency-renderer-youtube-extension')
      link.href = 'https://www.youtube.com/watch?v=test'
      container.appendChild(link)

      applyYoutubeVideos(container)

      expect(link.dataset.enhanced).toBeUndefined()
    })

    it('should skip links in markdown-view-pure', () => {
      container.classList.add('markdown-view-pure')
      const link = document.createElement('a')
      link.classList.add('markdown-video-link-youtube')
      link.href = 'https://www.youtube.com/watch?v=test'
      container.appendChild(link)

      applyYoutubeVideos(container)

      expect(link.dataset.enhanced).toBeUndefined()
    })
  })

  describe('multiple videos', () => {
    it('should enhance multiple YouTube videos', () => {
      const link1 = document.createElement('a')
      link1.classList.add('markdown-video-link-youtube')
      link1.href = 'https://www.youtube.com/watch?v=video1'

      const link2 = document.createElement('a')
      link2.classList.add('markdown-video-link-youtube')
      link2.href = 'https://www.youtube.com/watch?v=video2'

      container.appendChild(link1)
      container.appendChild(link2)

      applyYoutubeVideos(container)

      expect(link1.dataset.enhanced).toBe('true')
      expect(link2.dataset.enhanced).toBe('true')
    })

    it('should handle mix of YouTube and other links', () => {
      const youtubeLink = document.createElement('a')
      youtubeLink.classList.add('markdown-video-link-youtube')
      youtubeLink.href = 'https://www.youtube.com/watch?v=test'

      const regularLink = document.createElement('a')
      regularLink.href = 'https://example.com'

      container.appendChild(youtubeLink)
      container.appendChild(regularLink)

      applyYoutubeVideos(container)

      expect(youtubeLink.dataset.enhanced).toBe('true')
      expect(regularLink.dataset.enhanced).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should handle empty container', () => {
      expect(() => applyYoutubeVideos(container)).not.toThrow()
    })

    it('should handle container with no video links', () => {
      container.innerHTML = '<div>Some text</div>'
      expect(() => applyYoutubeVideos(container)).not.toThrow()
    })

    it('should handle links without href', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-video-link-youtube')
      container.appendChild(link)

      expect(() => applyYoutubeVideos(container)).not.toThrow()
    })

    it('should handle nested video links', () => {
      const wrapper = document.createElement('div')
      const link = document.createElement('a')
      link.classList.add('markdown-video-link-youtube')
      link.href = 'https://www.youtube.com/watch?v=test'
      wrapper.appendChild(link)
      container.appendChild(wrapper)

      applyYoutubeVideos(container)

      expect(link.dataset.enhanced).toBe('true')
    })
  })

  describe('embed URL handling', () => {
    it('should handle youtu.be short links', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-video-link-youtube')
      link.href = 'https://youtu.be/short-id'
      container.appendChild(link)

      applyYoutubeVideos(container)

      expect(link.dataset.enhanced).toBe('true')
      expect(link.dataset.embedSrc).toBeTruthy()
    })

    it('should handle YouTube shorts', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-video-link-youtube')
      link.href = 'https://www.youtube.com/shorts/short-video'
      container.appendChild(link)

      applyYoutubeVideos(container)

      expect(link.dataset.enhanced).toBe('true')
    })

    it('should handle embed URLs', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-video-link-youtube')
      link.href = 'https://www.youtube.com/embed/embed-id'
      container.appendChild(link)

      applyYoutubeVideos(container)

      expect(link.dataset.enhanced).toBe('true')
    })
  })
})
