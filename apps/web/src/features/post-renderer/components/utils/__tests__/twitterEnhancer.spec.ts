import { describe, it, expect, beforeEach, vi } from 'vitest'
import { applyTwitterEmbeds } from '../twitterEnhancer'
import React from 'react'

// Mock react-dom/client
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
}))

describe('applyTwitterEmbeds', () => {
  let container: HTMLElement
  let mockComponent: React.FC<{ id: string }>

  beforeEach(() => {
    container = document.createElement('div')
    container.classList.add('markdown-view')
    mockComponent = vi.fn(() => null) as any
  })

  describe('twitter.com URLs', () => {
    it('should enhance valid Twitter status links', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-external-link')
      link.href = 'https://twitter.com/username/status/1234567890'
      link.innerText = 'https://twitter.com/username/status/1234567890'
      container.appendChild(link)

      applyTwitterEmbeds(container, mockComponent)

      expect(link.dataset.enhanced).toBe('true')
      const wrapper = link.querySelector('.ecency-renderer-twitter-extension-frame')
      expect(wrapper).toBeTruthy()
    })

    it('should extract tweet ID correctly', async () => {
      const { createRoot } = await import('react-dom/client')
      const mockRender = vi.fn()
      vi.mocked(createRoot).mockReturnValue({ render: mockRender, unmount: vi.fn() } as any)

      const link = document.createElement('a')
      link.classList.add('markdown-external-link')
      link.href = 'https://twitter.com/elonmusk/status/9876543210'
      container.appendChild(link)

      applyTwitterEmbeds(container, mockComponent)

      expect(createRoot).toHaveBeenCalled()
      expect(mockRender).toHaveBeenCalled()
      // Check that component was called with correct ID prop
      const renderCall = mockRender.mock.calls[0][0]
      expect(renderCall.props).toEqual({ id: '9876543210' })
    })

    it('should handle URLs with extra path segments', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-external-link')
      link.href = 'https://twitter.com/user/status/123456/photo/1'
      container.appendChild(link)

      applyTwitterEmbeds(container, mockComponent)

      expect(link.dataset.enhanced).toBe('true')
    })
  })

  describe('x.com URLs', () => {
    it('should enhance x.com status links', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-external-link')
      link.href = 'https://x.com/username/status/1234567890'
      container.appendChild(link)

      applyTwitterEmbeds(container, mockComponent)

      expect(link.dataset.enhanced).toBe('true')
    })
  })

  describe('filtering invalid links', () => {
    it('should skip non-Twitter links', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-external-link')
      link.href = 'https://example.com/user/status/123'
      container.appendChild(link)

      applyTwitterEmbeds(container, mockComponent)

      expect(link.dataset.enhanced).toBeUndefined()
    })

    it('should skip links without status in path', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-external-link')
      link.href = 'https://twitter.com/username'
      container.appendChild(link)

      applyTwitterEmbeds(container, mockComponent)

      expect(link.dataset.enhanced).toBeUndefined()
    })

    it('should skip links with non-numeric tweet ID', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-external-link')
      link.href = 'https://twitter.com/user/status/notanumber'
      container.appendChild(link)

      applyTwitterEmbeds(container, mockComponent)

      expect(link.dataset.enhanced).toBeUndefined()
    })

    it('should skip links without status keyword', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-external-link')
      link.href = 'https://twitter.com/user/tweet/123456'
      container.appendChild(link)

      applyTwitterEmbeds(container, mockComponent)

      expect(link.dataset.enhanced).toBeUndefined()
    })

    it('should skip links with too few path segments', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-external-link')
      link.href = 'https://twitter.com/status/123456'
      container.appendChild(link)

      applyTwitterEmbeds(container, mockComponent)

      expect(link.dataset.enhanced).toBeUndefined()
    })

    it('should skip non-markdown-external-link elements', () => {
      const link = document.createElement('a')
      link.href = 'https://twitter.com/user/status/123456'
      container.appendChild(link)

      applyTwitterEmbeds(container, mockComponent)

      expect(link.dataset.enhanced).toBeUndefined()
    })

    it('should skip links in markdown-view-pure', () => {
      container.classList.add('markdown-view-pure')
      const link = document.createElement('a')
      link.classList.add('markdown-external-link')
      link.href = 'https://twitter.com/user/status/123456'
      container.appendChild(link)

      applyTwitterEmbeds(container, mockComponent)

      expect(link.dataset.enhanced).toBeUndefined()
    })
  })

  describe('duplicate prevention', () => {
    it('should not enhance already enhanced links', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-external-link')
      link.href = 'https://twitter.com/user/status/123456'
      link.dataset.enhanced = 'true'
      container.appendChild(link)

      const initialHTML = link.innerHTML

      applyTwitterEmbeds(container, mockComponent)

      expect(link.innerHTML).toBe(initialHTML)
    })
  })

  describe('multiple links', () => {
    it('should enhance multiple Twitter links', () => {
      const link1 = document.createElement('a')
      link1.classList.add('markdown-external-link')
      link1.href = 'https://twitter.com/user1/status/111111'

      const link2 = document.createElement('a')
      link2.classList.add('markdown-external-link')
      link2.href = 'https://twitter.com/user2/status/222222'

      container.appendChild(link1)
      container.appendChild(link2)

      applyTwitterEmbeds(container, mockComponent)

      expect(link1.dataset.enhanced).toBe('true')
      expect(link2.dataset.enhanced).toBe('true')
    })

    it('should enhance only valid Twitter links in mixed content', () => {
      const twitterLink = document.createElement('a')
      twitterLink.classList.add('markdown-external-link')
      twitterLink.href = 'https://twitter.com/user/status/123456'

      const regularLink = document.createElement('a')
      regularLink.classList.add('markdown-external-link')
      regularLink.href = 'https://example.com'

      container.appendChild(twitterLink)
      container.appendChild(regularLink)

      applyTwitterEmbeds(container, mockComponent)

      expect(twitterLink.dataset.enhanced).toBe('true')
      expect(regularLink.dataset.enhanced).toBeUndefined()
    })
  })

  describe('error handling', () => {
    it('should handle malformed URLs gracefully', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-external-link')
      link.href = 'not a valid url'
      container.appendChild(link)

      expect(() => applyTwitterEmbeds(container, mockComponent)).not.toThrow()
    })

    it('should handle missing href', () => {
      const link = document.createElement('a')
      link.classList.add('markdown-external-link')
      container.appendChild(link)

      expect(() => applyTwitterEmbeds(container, mockComponent)).not.toThrow()
    })

    it('should continue processing after error on one link', () => {
      const badLink = document.createElement('a')
      badLink.classList.add('markdown-external-link')
      badLink.href = null as any // Force error

      const goodLink = document.createElement('a')
      goodLink.classList.add('markdown-external-link')
      goodLink.href = 'https://twitter.com/user/status/123456'

      container.appendChild(badLink)
      container.appendChild(goodLink)

      applyTwitterEmbeds(container, mockComponent)

      expect(goodLink.dataset.enhanced).toBe('true')
    })
  })

  describe('edge cases', () => {
    it('should handle empty container', () => {
      expect(() => applyTwitterEmbeds(container, mockComponent)).not.toThrow()
    })

    it('should handle container with no links', () => {
      container.innerHTML = '<div>Some text</div>'
      expect(() => applyTwitterEmbeds(container, mockComponent)).not.toThrow()
    })
  })
})
