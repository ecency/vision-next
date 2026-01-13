import { describe, it, expect, beforeEach } from 'vitest'
import { applyTagLinks } from '../tagLinkEnhancer'

describe('applyTagLinks', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    container.classList.add('markdown-view')
  })

  describe('basic functionality', () => {
    it('should enhance tag links', () => {
      const tag = document.createElement('a')
      tag.classList.add('markdown-tag-link')
      tag.href = '/trending/hive'
      tag.innerText = '#hive'
      container.appendChild(tag)

      applyTagLinks(container)

      expect(tag.classList.contains('ecency-renderer-tag-link-enhanced')).toBe(true)
    })

    it('should enhance multiple tag links', () => {
      const tag1 = document.createElement('a')
      tag1.classList.add('markdown-tag-link')
      tag1.href = '/trending/hive'

      const tag2 = document.createElement('a')
      tag2.classList.add('markdown-tag-link')
      tag2.href = '/trending/blockchain'

      container.appendChild(tag1)
      container.appendChild(tag2)

      applyTagLinks(container)

      expect(tag1.classList.contains('ecency-renderer-tag-link-enhanced')).toBe(true)
      expect(tag2.classList.contains('ecency-renderer-tag-link-enhanced')).toBe(true)
    })

    it('should not affect non-tag links', () => {
      const regularLink = document.createElement('a')
      regularLink.href = 'https://example.com'
      regularLink.innerText = 'Regular link'
      container.appendChild(regularLink)

      applyTagLinks(container)

      expect(regularLink.classList.contains('ecency-renderer-tag-link-enhanced')).toBe(false)
    })
  })

  describe('selector specificity', () => {
    it('should only enhance links inside markdown-view', () => {
      const outsideContainer = document.createElement('div')
      const tag = document.createElement('a')
      tag.classList.add('markdown-tag-link')
      outsideContainer.appendChild(tag)

      applyTagLinks(container)

      expect(tag.classList.contains('ecency-renderer-tag-link-enhanced')).toBe(false)
    })

    it('should skip links in markdown-view-pure', () => {
      container.classList.add('markdown-view-pure')
      const tag = document.createElement('a')
      tag.classList.add('markdown-tag-link')
      container.appendChild(tag)

      applyTagLinks(container)

      expect(tag.classList.contains('ecency-renderer-tag-link-enhanced')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty container', () => {
      expect(() => applyTagLinks(container)).not.toThrow()
    })

    it('should handle container with no tag links', () => {
      container.innerHTML = '<div>Some text</div>'
      expect(() => applyTagLinks(container)).not.toThrow()
    })

    it('should handle nested tag links', () => {
      const wrapper = document.createElement('div')
      const tag = document.createElement('a')
      tag.classList.add('markdown-tag-link')
      wrapper.appendChild(tag)
      container.appendChild(wrapper)

      applyTagLinks(container)

      expect(tag.classList.contains('ecency-renderer-tag-link-enhanced')).toBe(true)
    })
  })
})
