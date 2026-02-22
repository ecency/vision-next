import { proxifyImageSrc, setProxyBase, getLatestUrl, extractPHash } from './proxify-image-src'

describe('getLatestUrl', () => {
  describe('with single proxification', () => {
    it('should return original URL when not proxified', () => {
      const input = 'https://i.imgur.com/muESb0B.png'

      expect(getLatestUrl(input)).toBe('https://i.imgur.com/muESb0B.png')
    })

    it('should extract URL from single proxification layer', () => {
      const input = 'https://images.ecency.com/0x0/https://i.imgur.com/muESb0B.png'

      expect(getLatestUrl(input)).toBe('https://i.imgur.com/muESb0B.png')
    })
  })

  describe('with nested proxification', () => {
    it('should extract deepest nested URL from multiple proxy layers', () => {
      const input = 'https://images.ecency.com/0x0/https://images.hive.io/0x0/https://i.imgur.com/muESb0B.png'

      expect(getLatestUrl(input)).toBe('https://i.imgur.com/muESb0B.png')
    })
  })
})

describe('extractPHash', () => {
  it('should extract pHash from proxified URL', () => {
    const input = 'https://images.ecency.com/p/RGgukq5E6HBNvuPpuJoWwfXPpi5ckcLESTB3nmmnMt8YnPwgHbJegFaUzokkErqT8JVe4zPL7GD3gy6aaZQERs3MF5KAGJQ1AL4MmhLWfmceyk6XXSqWaECh1YXC7aV.png?format=match&mode=fit'

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
      setProxyBase('https://images.ecency.com')
      const input = 'https://i.imgur.com/muESb0B.png'
      const expected = 'https://images.ecency.com/p/2bP4pJr4wVimqCWjYimXJe2cnCgnJdyHYxb4dfF6gmC?format=match&mode=fit'

      expect(proxifyImageSrc(input)).toBe(expected)
    })

    it('should re-proxify already proxified URL', () => {
      const input = 'https://images.ecency.com/0x0/https://i.imgur.com/muESb0B.png'
      const expected = 'https://images.ecency.com/p/2bP4pJr4wVimqCWjYimXJe2cnCgnJdyHYxb4dfF6gmC?format=match&mode=fit'

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
      setProxyBase('https://images.ecency.com')
      const input = 'https://images.hive.blog/60x70/http://hivebuzz.me/@hiveonboard/upvotes.png?202008050233'
      const expected = 'https://images.ecency.com/60x70/http://hivebuzz.me/@hiveonboard/upvotes.png?202008050233'

      expect(proxifyImageSrc(input)).toBe(expected)
    })
  })

  describe('with uploaded images', () => {
    it('should proxify uploaded image URL without file extension', () => {
      setProxyBase('https://images.ecency.com')
      const input = 'https://images.hive.blog/DQmT7UTd6JTP3bB2fXzV6tv8u4cJ6fLijy2bUxatkLChzHD/IMG_6631.JPG'
      const expected = 'https://images.ecency.com/p/Zskj9C56UonZ32EJw6nMctrTQ6kTQ3swaDmbMFtRtMzyrHs9JdvWTXeiP6cW6a7F6pv2A4qkeHLiAPVtmfYMDf3iYbydFZ7e8iYY4MZP74TgyWo8WnJa?format=match&mode=fit'

      expect(proxifyImageSrc(input)).toBe(expected)
    })
  })
})
