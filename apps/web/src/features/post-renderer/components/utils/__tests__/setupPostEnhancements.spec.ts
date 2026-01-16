import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupPostEnhancements } from '../setupPostEnhancements'
import * as utils from '../index'

// Mock all enhancer functions
vi.mock('../imageZoomEnhancer', () => ({
  applyImageZoom: vi.fn(),
}))

vi.mock('../hivePostLinkEnhancer', () => ({
  applyHivePostLinks: vi.fn(),
}))

vi.mock('../hiveAuthorLinkEnhancer', () => ({
  applyAuthorLinks: vi.fn(),
}))

vi.mock('../hiveOperationEnhancer', () => ({
  applyHiveOperations: vi.fn(),
}))

vi.mock('../tagLinkEnhancer', () => ({
  applyTagLinks: vi.fn(),
}))

vi.mock('../youtubeVideosEnhancer', () => ({
  applyYoutubeVideos: vi.fn(),
}))

vi.mock('../threespeakVideosEnhancer', () => ({
  applyThreeSpeakVideos: vi.fn(),
}))

vi.mock('../waveLinkEnhancer', () => ({
  applyWaveLikePosts: vi.fn(),
}))

vi.mock('../twitterEnhancer', () => ({
  applyTwitterEmbeds: vi.fn(),
}))

vi.mock('../../functions', () => ({
  findPostLinkElements: vi.fn(() => []),
}))

describe('setupPostEnhancements', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.classList.add('markdown-view')
    vi.clearAllMocks()
    // Reset all mocks to not throw
    vi.mocked(utils.applyImageZoom).mockImplementation(() => {})
  })

  describe('basic enhancement flow', () => {
    it('should call all enhancement functions in correct order', async () => {
      const {
        applyImageZoom,
        applyHivePostLinks,
        applyAuthorLinks,
        applyHiveOperations,
        applyTagLinks,
        applyYoutubeVideos,
        applyThreeSpeakVideos,
        applyWaveLikePosts,
        applyTwitterEmbeds,
      } = utils

      setupPostEnhancements(container)

      expect(applyImageZoom).toHaveBeenCalledWith(container)
      expect(applyHivePostLinks).toHaveBeenCalled()
      expect(applyAuthorLinks).toHaveBeenCalledWith(container)
      expect(applyHiveOperations).toHaveBeenCalledWith(container, undefined)
      expect(applyTagLinks).toHaveBeenCalledWith(container)
      expect(applyYoutubeVideos).toHaveBeenCalledWith(container)
      expect(applyThreeSpeakVideos).toHaveBeenCalledWith(container)
      expect(applyWaveLikePosts).toHaveBeenCalled()
      expect(applyTwitterEmbeds).toHaveBeenCalled()
    })

    it('should find post link elements once', async () => {
      const { findPostLinkElements } = await import('../../functions')

      setupPostEnhancements(container)

      expect(findPostLinkElements).toHaveBeenCalledTimes(1)
      expect(findPostLinkElements).toHaveBeenCalledWith(container)
    })

    it('should reuse post link elements for multiple enhancers', async () => {
      const mockElements = [document.createElement('a')]
      const { findPostLinkElements } = await import('../../functions')
      vi.mocked(findPostLinkElements).mockReturnValue(mockElements)

      const { applyHivePostLinks, applyWaveLikePosts } = utils

      setupPostEnhancements(container)

      expect(applyHivePostLinks).toHaveBeenCalledWith(container, mockElements)
      expect(applyWaveLikePosts).toHaveBeenCalledWith(container, mockElements)
    })
  })

  describe('options handling', () => {
    it('should pass onHiveOperationClick to applyHiveOperations', () => {
      const { applyHiveOperations } = utils
      const mockHandler = vi.fn()

      setupPostEnhancements(container, {
        onHiveOperationClick: mockHandler,
      })

      expect(applyHiveOperations).toHaveBeenCalledWith(container, mockHandler)
    })

    it('should pass custom TwitterComponent to applyTwitterEmbeds', () => {
      const { applyTwitterEmbeds } = utils
      const CustomComponent = vi.fn(() => null) as any

      setupPostEnhancements(container, {
        TwitterComponent: CustomComponent,
      })

      expect(applyTwitterEmbeds).toHaveBeenCalledWith(container, CustomComponent)
    })

    it('should use default TwitterComponent if not provided', () => {
      const { applyTwitterEmbeds } = utils

      setupPostEnhancements(container)

      expect(applyTwitterEmbeds).toHaveBeenCalled()
      const callArgs = vi.mocked(applyTwitterEmbeds).mock.calls[0]
      expect(callArgs[1]).toBeDefined()
      expect(typeof callArgs[1]).toBe('function')
    })

    it('should handle both options together', () => {
      const { applyHiveOperations, applyTwitterEmbeds } = utils
      const mockOpHandler = vi.fn()
      const CustomTwitter = vi.fn() as any

      setupPostEnhancements(container, {
        onHiveOperationClick: mockOpHandler,
        TwitterComponent: CustomTwitter,
      })

      expect(applyHiveOperations).toHaveBeenCalledWith(container, mockOpHandler)
      expect(applyTwitterEmbeds).toHaveBeenCalledWith(container, CustomTwitter)
    })
  })

  describe('enhancement order', () => {
    it('should apply image zoom before other enhancements', () => {
      const callOrder: string[] = []

      const { applyImageZoom, applyHivePostLinks } = utils
      vi.mocked(applyImageZoom).mockImplementation(() => callOrder.push('imageZoom'))
      vi.mocked(applyHivePostLinks).mockImplementation(() => callOrder.push('postLinks'))

      setupPostEnhancements(container)

      expect(callOrder[0]).toBe('imageZoom')
    })

    it('should find post links before applying link enhancements', async () => {
      const callOrder: string[] = []

      const { findPostLinkElements } = await import('../../functions')
      const { applyHivePostLinks } = utils

      vi.mocked(findPostLinkElements).mockImplementation(() => {
        callOrder.push('findLinks')
        return []
      })
      vi.mocked(applyHivePostLinks).mockImplementation(() => callOrder.push('applyLinks'))

      setupPostEnhancements(container)

      const findIndex = callOrder.indexOf('findLinks')
      const applyIndex = callOrder.indexOf('applyLinks')
      expect(findIndex).toBeLessThan(applyIndex)
    })
  })

  describe('error resilience', () => {
    it('should throw if one enhancer throws', () => {
      const { applyImageZoom, applyAuthorLinks } = utils
      vi.mocked(applyImageZoom).mockImplementation(() => {
        throw new Error('Image zoom failed')
      })

      // Should throw and stop execution
      expect(() => setupPostEnhancements(container)).toThrow('Image zoom failed')

      // Subsequent enhancers should not be called due to throw
      expect(applyAuthorLinks).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle empty container', () => {
      expect(() => setupPostEnhancements(container)).not.toThrow()
    })

    it('should handle container with complex nested structure', () => {
      const nested = document.createElement('div')
      nested.innerHTML = `
        <div>
          <img src="test.jpg" />
          <a href="https://ecency.com/@user/post">Post link</a>
          <a class="markdown-tag-link" href="/trending/hive">#hive</a>
        </div>
      `
      container.appendChild(nested)

      expect(() => setupPostEnhancements(container)).not.toThrow()
    })

    it('should handle undefined options', () => {
      expect(() => setupPostEnhancements(container, undefined)).not.toThrow()
    })

    it('should handle empty options object', () => {
      expect(() => setupPostEnhancements(container, {})).not.toThrow()
    })
  })

  describe('integration patterns', () => {
    it('should handle typical post content', () => {
      container.innerHTML = `
        <div class="markdown-view">
          <p>Check out this post: <a href="https://ecency.com/@alice/post">@alice/post</a></p>
          <img src="image.jpg" title="My image" />
          <p>Follow <a class="markdown-author-link" href="/@bob">@bob</a></p>
          <p>Tagged with <a class="markdown-tag-link" href="/trending/hive">#hive</a></p>
        </div>
      `

      expect(() => setupPostEnhancements(container)).not.toThrow()

      // Verify all enhancers were called
      const {
        applyImageZoom,
        applyHivePostLinks,
        applyAuthorLinks,
        applyTagLinks,
      } = utils

      expect(applyImageZoom).toHaveBeenCalled()
      expect(applyHivePostLinks).toHaveBeenCalled()
      expect(applyAuthorLinks).toHaveBeenCalled()
      expect(applyTagLinks).toHaveBeenCalled()
    })
  })
})
