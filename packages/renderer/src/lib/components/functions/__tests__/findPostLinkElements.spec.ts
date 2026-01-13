import { describe, it, expect, beforeEach } from 'vitest'
import { findPostLinkElements } from '../find-post-link-elements'

describe('findPostLinkElements', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.classList.add('markdown-view')
  })

  describe('valid post links', () => {
    it('should find basic Ecency post links', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/my-post'
      anchor.innerText = '@alice/my-post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
      expect(results[0]).toBe(anchor)
      expect(anchor.classList.contains('markdown-post-link')).toBe(true)
    })

    it('should find PeakD post links', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://peakd.com/@bob/test-post'
      anchor.innerText = '@bob/test-post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
      expect(anchor.classList.contains('markdown-post-link')).toBe(true)
    })

    it('should find Hive Blog post links', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://hive.blog/@charlie/another-post'
      anchor.innerText = '@charlie/another-post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
      expect(anchor.classList.contains('markdown-post-link')).toBe(true)
    })

    it('should find community post links', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/hive-123456/@alice/post'
      anchor.innerText = 'hive-123456/@alice/post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
      expect(anchor.classList.contains('markdown-post-link')).toBe(true)
    })

    it('should find links with exact URL as text', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/my-post'
      anchor.innerText = 'https://ecency.com/@alice/my-post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
    })

    it('should handle relative URLs', () => {
      const anchor = document.createElement('a')
      anchor.href = '/@alice/my-post'
      anchor.innerText = '@alice/my-post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
    })

    it('should handle URLs with www prefix', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://www.ecency.com/@alice/post'
      anchor.innerText = '@alice/post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
    })
  })

  describe('invalid post links', () => {
    it('should skip links without href', () => {
      const anchor = document.createElement('a')
      anchor.innerText = '@alice/my-post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should skip links without author', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/my-post'
      anchor.innerText = 'my-post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should skip links without @ prefix on author', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/alice/my-post'
      anchor.innerText = 'alice/my-post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should skip comment links (hash with @)', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post#@bob/comment'
      anchor.innerText = '@alice/post#@bob/comment'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should skip external links', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://example.com/@alice/post'
      anchor.innerText = '@alice/post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should skip non-http protocols', () => {
      const anchor = document.createElement('a')
      anchor.href = 'javascript:alert("xss")'
      anchor.innerText = '@alice/post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should skip links with data-isInline="true"', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = '@alice/post'
      anchor.dataset.isInline = 'true'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should skip links with mismatched display text', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = 'Click here for my post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should skip links with too many path segments', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/a/b/c/@alice/post'
      anchor.innerText = '@alice/post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should skip links in markdown-view-pure containers', () => {
      container.classList.add('markdown-view-pure')
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = '@alice/post'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })
  })

  describe('caching behavior', () => {
    it('should mark checked links with dataset', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = '@alice/post'
      container.appendChild(anchor)

      findPostLinkElements(container)
      expect(anchor.dataset.postLinkChecked).toBe('true')
    })

    it('should return cached results on second call', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = '@alice/post'
      container.appendChild(anchor)

      const firstResult = findPostLinkElements(container)
      const secondResult = findPostLinkElements(container)

      expect(firstResult).toHaveLength(1)
      expect(secondResult).toHaveLength(1)
      expect(firstResult[0]).toBe(secondResult[0])
    })

    it('should return already classified post links', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = '@alice/post'
      anchor.classList.add('markdown-post-link')
      anchor.dataset.postLinkChecked = 'true'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
      expect(results[0]).toBe(anchor)
    })
  })

  describe('multiple links', () => {
    it('should find multiple valid post links', () => {
      const anchor1 = document.createElement('a')
      anchor1.href = 'https://ecency.com/@alice/post1'
      anchor1.innerText = '@alice/post1'

      const anchor2 = document.createElement('a')
      anchor2.href = 'https://ecency.com/@bob/post2'
      anchor2.innerText = '@bob/post2'

      const anchor3 = document.createElement('a')
      anchor3.href = 'https://example.com/not-a-post'
      anchor3.innerText = 'External link'

      container.appendChild(anchor1)
      container.appendChild(anchor2)
      container.appendChild(anchor3)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(2)
      expect(results).toContain(anchor1)
      expect(results).toContain(anchor2)
      expect(results).not.toContain(anchor3)
    })
  })

  describe('URL normalization', () => {
    it('should handle URLs with query parameters', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post?ref=twitter'
      anchor.innerText = 'https://ecency.com/@alice/post?ref=twitter'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
    })

    it('should handle URLs with encoded characters', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post-with%20space'
      anchor.innerText = '@alice/post-with space'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
    })

    it('should handle URLs with trailing slashes', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post/'
      anchor.innerText = 'https://ecency.com/@alice/post/'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
    })
  })

  describe('edge cases', () => {
    it('should handle empty container', () => {
      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should handle container with no anchors', () => {
      container.innerHTML = '<div>Some text</div><p>More text</p>'
      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should handle nested anchors in markdown-view', () => {
      const wrapper = document.createElement('div')
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = '@alice/post'
      wrapper.appendChild(anchor)
      container.appendChild(wrapper)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
    })
  })
})
