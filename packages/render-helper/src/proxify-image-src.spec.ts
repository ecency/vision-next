import { proxifyImageSrc, buildSrcSet, setProxyBase, getLatestUrl, extractPHash } from './proxify-image-src'

describe('getLatestUrl', () => {
  describe('with single proxification', () => {
    it('should return original URL when not proxified', () => {
      const input = 'https://i.imgur.com/muESb0B.png'

      expect(getLatestUrl(input)).toBe('https://i.imgur.com/muESb0B.png')
    })

    it('should extract URL from single proxification layer', () => {
      const input = 'https://i.ecency.com/0x0/https://i.imgur.com/muESb0B.png'

      expect(getLatestUrl(input)).toBe('https://i.imgur.com/muESb0B.png')
    })
  })

  describe('with nested proxification', () => {
    it('should extract deepest nested URL from multiple proxy layers', () => {
      const input = 'https://i.ecency.com/0x0/https://images.hive.io/0x0/https://i.imgur.com/muESb0B.png'

      expect(getLatestUrl(input)).toBe('https://i.imgur.com/muESb0B.png')
    })
  })
})

describe('extractPHash', () => {
  it('should extract pHash from proxified URL', () => {
    const input = 'https://i.ecency.com/p/RGgukq5E6HBNvuPpuJoWwfXPpi5ckcLESTB3nmmnMt8YnPwgHbJegFaUzokkErqT8JVe4zPL7GD3gy6aaZQERs3MF5KAGJQ1AL4MmhLWfmceyk6XXSqWaECh1YXC7aV.png?format=match&mode=fit'

    expect(extractPHash(input)).toBe('RGgukq5E6HBNvuPpuJoWwfXPpi5ckcLESTB3nmmnMt8YnPwgHbJegFaUzokkErqT8JVe4zPL7GD3gy6aaZQERs3MF5KAGJQ1AL4MmhLWfmceyk6XXSqWaECh1YXC7aV')
  })

  it('should return null when no pHash present', () => {
    const input = 'https://i.imgur.com/muESb0B.png'

    expect(extractPHash(input)).toBe(null)
  })
})

describe('proxifyImageSrc', () => {
  describe('basic proxification', () => {
    it('should proxify image URL without file extension', () => {
      setProxyBase('https://i.ecency.com')
      const input = 'https://i.imgur.com/muESb0B.png'
      const expected = 'https://i.ecency.com/p/2bP4pJr4wVimqCWjYimXJe2cnCgnJdyHYxb4dfF6gmC?format=match&mode=fit'

      expect(proxifyImageSrc(input)).toBe(expected)
    })

    it('should re-proxify already proxified URL', () => {
      const input = 'https://i.ecency.com/0x0/https://i.imgur.com/muESb0B.png'
      const expected = 'https://i.ecency.com/p/2bP4pJr4wVimqCWjYimXJe2cnCgnJdyHYxb4dfF6gmC?format=match&mode=fit'

      expect(proxifyImageSrc(input)).toBe(expected)
    })

    it('should always use format=match regardless of format parameter', () => {
      const input = 'https://i.imgur.com/muESb0B.png'
      const result = proxifyImageSrc(input, 0, 0, 'webp')

      expect(result).toContain('format=match')
      expect(result).not.toContain('format=webp')
      expect(result).not.toContain('.webp')
      expect(result).not.toContain('.png')
    })
  })

  describe('custom proxy base', () => {
    it('should use custom proxy base URL', () => {
      setProxyBase('https://images.hive.blog')

      const input = 'https://i.imgur.com/muESb0B.png'
      const expected = 'https://images.hive.blog/p/2bP4pJr4wVimqCWjYimXJe2cnCgnJdyHYxb4dfF6gmC?format=match&mode=fit'

      expect(proxifyImageSrc(input)).toBe(expected)
    })

    it('should replace existing proxy base with new one', () => {
      setProxyBase('https://i.ecency.com')
      const input = 'https://images.hive.blog/60x70/http://hivebuzz.me/@hiveonboard/upvotes.png?202008050233'
      const expected = 'https://i.ecency.com/60x70/http://hivebuzz.me/@hiveonboard/upvotes.png?202008050233'

      expect(proxifyImageSrc(input)).toBe(expected)
    })

    it('should host-swap legacy images.ecency.com /p/ URLs to the proxy base', () => {
      setProxyBase('https://i.ecency.com')
      const input = 'https://images.ecency.com/p/2bP4pJr4wVimqCWjYimXJe2cnCgnJdyHYxb4dfF6gmC?format=match&mode=fit'
      const expected = 'https://i.ecency.com/p/2bP4pJr4wVimqCWjYimXJe2cnCgnJdyHYxb4dfF6gmC?format=match&mode=fit'

      expect(proxifyImageSrc(input)).toBe(expected)
    })

    it('should host-swap legacy images.ecency.com avatar URLs to the proxy base', () => {
      setProxyBase('https://i.ecency.com')
      const input = 'https://images.ecency.com/u/pizzabot/avatar/small'

      expect(proxifyImageSrc(input)).toBe('https://i.ecency.com/u/pizzabot/avatar/small')
    })
  })

  describe('with uploaded images', () => {
    it('should proxify uploaded image URL without file extension', () => {
      setProxyBase('https://i.ecency.com')
      const input = 'https://images.hive.blog/DQmT7UTd6JTP3bB2fXzV6tv8u4cJ6fLijy2bUxatkLChzHD/IMG_6631.JPG'
      const expected = 'https://i.ecency.com/p/Zskj9C56UonZ32EJw6nMctrTQ6kTQ3swaDmbMFtRtMzyrHs9JdvWTXeiP6cW6a7F6pv2A4qkeHLiAPVtmfYMDf3iYbydFZ7e8iYY4MZP74TgyWo8WnJa?format=match&mode=fit'

      expect(proxifyImageSrc(input)).toBe(expected)
    })
  })
})

describe('buildSrcSet', () => {
  beforeEach(() => {
    setProxyBase('https://i.ecency.com')
  })

  it('should return empty string for falsy input', () => {
    expect(buildSrcSet('')).toBe('')
    expect(buildSrcSet(undefined)).toBe('')
  })

  it('should generate srcset with width descriptors for a raw image URL', () => {
    const result = buildSrcSet('https://i.imgur.com/muESb0B.png')

    expect(result).toContain('320w')
    expect(result).toContain('600w')
    expect(result).toContain('800w')
    expect(result).toContain('1024w')
    expect(result).toContain('1280w')
    expect(result.split(', ')).toHaveLength(5)
  })

  it('should include width parameter in each srcset entry', () => {
    const result = buildSrcSet('https://i.imgur.com/muESb0B.png')
    const entries = result.split(', ')

    for (const entry of entries) {
      expect(entry).toMatch(/width=\d+/)
      expect(entry).toContain('format=match')
      expect(entry).toContain('mode=fit')
    }
  })

  it('should handle already-proxied URLs by extracting hash', () => {
    const hash = '2bP4pJr4wVimqCWjYimXJe2cnCgnJdyHYxb4dfF6gmC'
    const input = `https://i.ecency.com/p/${hash}?format=match&mode=fit`
    const result = buildSrcSet(input)

    expect(result).toContain(`/p/${hash}?format=match&mode=fit&width=320 320w`)
    expect(result).toContain(`/p/${hash}?format=match&mode=fit&width=1280 1280w`)
  })

  it('should normalize legacy proxied URLs with file extensions', () => {
    setProxyBase('https://i.ecency.com')
    const hash = 'RGgukq5E6HBNvuPpuJoWwfXPpi5ckcLESTB3nmmnMt8YnPwgHbJegFaUzokkErqT8JVe4zPL7GD3gy6aaZQERs3MF5KAGJQ1AL4MmhLWfmceyk6XXSqWaECh1YXC7aV'
    const input = `https://i.ecency.com/p/${hash}.png?format=match&mode=fit`
    const result = buildSrcSet(input)

    expect(result).toContain(`/p/${hash}?format=match&mode=fit&width=320 320w`)
    expect(result).toContain(`/p/${hash}?format=match&mode=fit&width=1280 1280w`)
    expect(result).not.toContain('.png')
  })

  it('should use custom proxy base for already-proxied URLs', () => {
    setProxyBase('https://images.hive.blog')
    const hash = 'someHash123'
    const input = `https://images.hive.blog/p/${hash}?format=match&mode=fit`
    const result = buildSrcSet(input)

    expect(result).toContain('https://images.hive.blog/p/someHash123')
    expect(result).not.toContain('i.ecency.com')
  })
})

describe('proxifyImageSrc transform-aware unwind (images.ecency.com uploads)', () => {
  const upload = 'https://images.ecency.com/DQmfEjdTaDpofgAtbPjUjkT9uNKK3gR7n1PeHT3QJAYeXwq/img_0402.jpg'

  beforeEach(() => {
    setProxyBase('https://i.ecency.com')
  })

  it('should hostname-swap to direct-serve when no transform is requested', () => {
    // Plain full-size fetch: the direct-serve route is correct and avoids a
    // proxy self-fetch. This preserves the SNI-resilient hostname swap.
    expect(proxifyImageSrc(upload)).toBe(
      'https://i.ecency.com/DQmfEjdTaDpofgAtbPjUjkT9uNKK3gR7n1PeHT3QJAYeXwq/img_0402.jpg'
    )
  })

  it('should route through /p/ when a width is requested (so resize actually applies)', () => {
    const result = proxifyImageSrc(upload, 600)

    expect(result).toMatch(/^https:\/\/i\.ecency\.com\/p\//)
    expect(result).not.toContain('/DQm')
    expect(result).toContain('width=600')
    expect(result).toContain('format=match')
    expect(result).toContain('mode=fit')
  })

  it('should route through /p/ when a height is requested', () => {
    const result = proxifyImageSrc(upload, 0, 400)

    expect(result).toMatch(/^https:\/\/i\.ecency\.com\/p\//)
    expect(result).toContain('height=400')
  })

  it('should route through /p/ and emit blur=1 for a blur placeholder', () => {
    const result = proxifyImageSrc(upload, 0, 0, 'match', { blur: true })

    expect(result).toMatch(/^https:\/\/i\.ecency\.com\/p\//)
    expect(result).not.toContain('/DQm')
    expect(result).toContain('blur=1')
  })

  it('should emit blur=1 for an already-direct i.ecency.com upload URL', () => {
    // catchPostImage(entry, 0, 0) hands us the already-unwound direct URL;
    // re-proxifying it with blur must still produce a /p/ transform URL.
    const direct = 'https://i.ecency.com/DQmfEjdTaDpofgAtbPjUjkT9uNKK3gR7n1PeHT3QJAYeXwq/img_0402.jpg'
    const result = proxifyImageSrc(direct, 0, 0, 'match', { blur: true })

    expect(result).toMatch(/^https:\/\/i\.ecency\.com\/p\//)
    expect(result).toContain('blur=1')
  })

  it('should not affect non-upload images (blur still proxifies a plain URL)', () => {
    const result = proxifyImageSrc('https://i.imgur.com/muESb0B.png', 0, 0, 'match', { blur: true })

    expect(result).toContain('blur=1')
    expect(result).toMatch(/^https:\/\/i\.ecency\.com\/p\//)
  })

  it('should route an unsized upload through /p/ for format negotiation when forceProxy is set', () => {
    // No width/height, but forceProxy → /p/ (so the server negotiates WebP/AVIF)
    // rather than the original-format direct-serve URL.
    const result = proxifyImageSrc(upload, 0, 0, 'match', { forceProxy: true })

    expect(result).toMatch(/^https:\/\/i\.ecency\.com\/p\//)
    expect(result).not.toContain('/DQm')
    expect(result).toContain('format=match')
    expect(result).not.toContain('width=')
    expect(result).not.toContain('blur=')
  })

  it('should still direct-serve an unsized upload without forceProxy (OG/social path)', () => {
    expect(proxifyImageSrc(upload)).toBe(
      'https://i.ecency.com/DQmfEjdTaDpofgAtbPjUjkT9uNKK3gR7n1PeHT3QJAYeXwq/img_0402.jpg'
    )
  })
})
