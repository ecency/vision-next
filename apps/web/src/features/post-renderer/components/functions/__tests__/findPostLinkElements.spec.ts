import { describe, it, expect, beforeEach } from 'vitest'
import { findPostLinkElements } from '../find-post-link-elements'

describe('findPostLinkElements', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.classList.add('markdown-view')
  })

  describe('trusts render-helper attributes', () => {
    it('should find links marked as inline by render-helper', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/my-post'
      anchor.innerText = '@alice/my-post'
      anchor.classList.add('markdown-post-link') // Set by render-helper
      anchor.dataset.isInline = 'true' // Set by render-helper
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
      expect(results[0]).toBe(anchor)
    })

    it('should skip links marked as non-inline by render-helper', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = 'Click here to read my post' // Custom text
      anchor.classList.add('markdown-post-link') // Set by render-helper
      anchor.dataset.isInline = 'false' // Set by render-helper (not inline)
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should skip links without markdown-post-link class', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://example.com/article'
      anchor.innerText = 'External link'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should skip links without data-is-inline attribute', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = '@alice/post'
      anchor.classList.add('markdown-post-link')
      // No data-is-inline set
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })
  })

  describe('supports different post link formats', () => {
    it('should find PeakD post links', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://peakd.com/@bob/test-post'
      anchor.innerText = '@bob/test-post'
      anchor.classList.add('markdown-post-link')
      anchor.dataset.isInline = 'true'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
    })

    it('should find Hive Blog post links', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://hive.blog/@charlie/another-post'
      anchor.innerText = '@charlie/another-post'
      anchor.classList.add('markdown-post-link')
      anchor.dataset.isInline = 'true'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
    })

    it('should find community post links', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/hive-123456/@alice/post'
      anchor.innerText = 'hive-123456/@alice/post'
      anchor.classList.add('markdown-post-link')
      anchor.dataset.isInline = 'true'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
    })

    it('should find links with exact URL as text', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/my-post'
      anchor.innerText = 'https://ecency.com/@alice/my-post'
      anchor.classList.add('markdown-post-link')
      anchor.dataset.isInline = 'true'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
    })

  })

  describe('caching behavior', () => {
    it('should mark checked links with dataset', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = '@alice/post'
      anchor.classList.add('markdown-post-link')
      anchor.dataset.isInline = 'true'
      container.appendChild(anchor)

      findPostLinkElements(container)
      expect(anchor.dataset.postLinkChecked).toBe('true')
      expect(anchor.dataset.postLinkEnhanceable).toBe('true')
    })

    it('should return cached results on second call', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = '@alice/post'
      anchor.classList.add('markdown-post-link')
      anchor.dataset.isInline = 'true'
      container.appendChild(anchor)

      const firstResult = findPostLinkElements(container)
      const secondResult = findPostLinkElements(container)

      expect(firstResult).toHaveLength(1)
      expect(secondResult).toHaveLength(1)
      expect(firstResult[0]).toBe(secondResult[0])
    })

    it('should use cached result even if data-is-inline changes', () => {
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = '@alice/post'
      anchor.classList.add('markdown-post-link')
      anchor.dataset.isInline = 'true'
      anchor.dataset.postLinkChecked = 'true'
      anchor.dataset.postLinkEnhanceable = 'true'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
      expect(results[0]).toBe(anchor)
    })
  })

  describe('markdown-view-pure containers', () => {
    it('should skip links in markdown-view-pure containers', () => {
      container.classList.add('markdown-view-pure')
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = '@alice/post'
      anchor.classList.add('markdown-post-link')
      anchor.dataset.isInline = 'true'
      container.appendChild(anchor)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })
  })

  describe('multiple links', () => {
    it('should find multiple inline post links', () => {
      const anchor1 = document.createElement('a')
      anchor1.href = 'https://ecency.com/@alice/post1'
      anchor1.innerText = '@alice/post1'
      anchor1.classList.add('markdown-post-link')
      anchor1.dataset.isInline = 'true'

      const anchor2 = document.createElement('a')
      anchor2.href = 'https://ecency.com/@bob/post2'
      anchor2.innerText = '@bob/post2'
      anchor2.classList.add('markdown-post-link')
      anchor2.dataset.isInline = 'true'

      const anchor3 = document.createElement('a')
      anchor3.href = 'https://example.com/not-a-post'
      anchor3.innerText = 'External link'
      // No markdown-post-link class - not a post link

      container.appendChild(anchor1)
      container.appendChild(anchor2)
      container.appendChild(anchor3)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(2)
      expect(results).toContain(anchor1)
      expect(results).toContain(anchor2)
      expect(results).not.toContain(anchor3)
    })

    it('should filter out non-inline post links', () => {
      const inlineLink = document.createElement('a')
      inlineLink.href = 'https://ecency.com/@alice/post1'
      inlineLink.innerText = '@alice/post1'
      inlineLink.classList.add('markdown-post-link')
      inlineLink.dataset.isInline = 'true'

      const nonInlineLink = document.createElement('a')
      nonInlineLink.href = 'https://ecency.com/@bob/post2'
      nonInlineLink.innerText = 'Check out this post!'
      nonInlineLink.classList.add('markdown-post-link')
      nonInlineLink.dataset.isInline = 'false'

      container.appendChild(inlineLink)
      container.appendChild(nonInlineLink)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
      expect(results).toContain(inlineLink)
      expect(results).not.toContain(nonInlineLink)
    })
  })

  describe('edge cases', () => {
    it('should handle empty container', () => {
      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should handle container with no post links', () => {
      container.innerHTML = '<div>Some text</div><p>More text</p><a href="https://example.com">External</a>'
      const results = findPostLinkElements(container)
      expect(results).toHaveLength(0)
    })

    it('should handle nested anchors in markdown-view', () => {
      const wrapper = document.createElement('div')
      const anchor = document.createElement('a')
      anchor.href = 'https://ecency.com/@alice/post'
      anchor.innerText = '@alice/post'
      anchor.classList.add('markdown-post-link')
      anchor.dataset.isInline = 'true'
      wrapper.appendChild(anchor)
      container.appendChild(wrapper)

      const results = findPostLinkElements(container)
      expect(results).toHaveLength(1)
    })
  })
})
