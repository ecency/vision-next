import { linkify } from './linkify.method'

describe('linkify() method - Content Linkification', () => {
  describe('hashtag linkification', () => {
    it('should linkify hashtags at start of content', () => {
      const content = '#bitcoin is great'
      const result = linkify(content, false)

      expect(result).toContain('class="markdown-tag-link"')
      expect(result).toContain('href="/trending/bitcoin"')
      expect(result).toContain('#bitcoin</a>')
    })

    it('should linkify hashtags after spaces', () => {
      const content = 'I love #cryptocurrency and #blockchain'
      const result = linkify(content, false)

      expect(result).toContain('href="/trending/cryptocurrency"')
      expect(result).toContain('href="/trending/blockchain"')
    })

    it('should linkify hashtags after closing tags', () => {
      const content = '<strong>Bold</strong>#technology'
      const result = linkify(content, false)

      expect(result).toContain('class="markdown-tag-link"')
      expect(result).toContain('href="/trending/technology"')
    })

    it('should not linkify hashtags with only numbers', () => {
      const content = 'Test #123 numbers'
      const result = linkify(content, false)

      expect(result).not.toContain('class="markdown-tag-link"')
      expect(result).toBe(content)
    })

    it('should lowercase hashtags in links', () => {
      const content = '#Bitcoin #CRYPTO'
      const result = linkify(content, false)

      expect(result).toContain('href="/trending/bitcoin"')
      expect(result).toContain('href="/trending/crypto"')
    })

    it('should use data-tag attribute for app mode', () => {
      const content = '#bitcoin'
      const result = linkify(content, true)

      expect(result).toContain('data-tag="bitcoin"')
      expect(result).not.toContain('href=')
    })
  })

  describe('user mention linkification', () => {
    it('should linkify user mentions at start of content', () => {
      const content = '@username wrote this'
      const result = linkify(content, false)

      expect(result).toContain('class="markdown-author-link"')
      expect(result).toContain('href="/@username"')
      expect(result).toContain('@username</a>')
    })

    it('should linkify user mentions after spaces', () => {
      const content = 'Thanks @alice and @bob'
      const result = linkify(content, false)

      expect(result).toContain('href="/@alice"')
      expect(result).toContain('href="/@bob"')
    })

    it('should preserve username case in display but lowercase in links', () => {
      const content = ' @username @alice'
      const result = linkify(content, false)

      expect(result).toContain('href="/@username"')
      expect(result).toContain('href="/@alice"')
    })

    it('should use data-author attribute for app mode', () => {
      const content = '@username'
      const result = linkify(content, true)

      expect(result).toContain('data-author="username"')
      expect(result).not.toContain('href=')
    })

    it('should handle usernames with dots', () => {
      const content = '@user.name is valid'
      const result = linkify(content, false)

      expect(result).toContain('href="/@user.name"')
    })

    it('should handle usernames with hyphens', () => {
      const content = '@user-name is valid'
      const result = linkify(content, false)

      expect(result).toContain('href="/@user-name"')
    })

    it('should linkify internal post links with @author/permlink', () => {
      const content = '@user/name is post link'
      const result = linkify(content, false)

      // This is actually a valid post link format
      expect(result).toContain('markdown-post-link')
      expect(result).toContain('href="/post/@user/name"')
    })
  })

  describe('internal post links', () => {
    it('should linkify internal post links with @author/permlink format', () => {
      const content = 'Check @author/my-post here'
      const result = linkify(content, false)

      expect(result).toContain('class="markdown-post-link"')
      expect(result).toContain('href="/post/@author/my-post"')
    })

    it('should linkify internal links starting with /@', () => {
      const content = 'Read /@alice/awesome-article today'
      const result = linkify(content, false)

      expect(result).toContain('href="/post/@alice/awesome-article"')
    })

    it('should use data attributes for app mode', () => {
      const content = '@bob/cool-post'
      const result = linkify(content, true)

      expect(result).toContain('data-author="bob"')
      expect(result).toContain('data-tag="post"')
      expect(result).toContain('data-permlink="cool-post"')
    })

    it('should handle profile section links', () => {
      const content = 'Visit @user/wallet for details'
      const result = linkify(content, false)

      expect(result).toContain('class="markdown-profile-link"')
      expect(result).toContain('href="/@user/wallet"')
    })

    it('should use full URL for app mode with profile sections', () => {
      const content = '@user/wallet'
      const result = linkify(content, true)

      expect(result).toContain('href="https://ecency.com/@user/wallet"')
    })

    it('should sanitize permlinks with query params', () => {
      const content = '@author/post?param=value'
      const result = linkify(content, false)

      expect(result).toContain('href="/post/@author/post"')
    })

    it('should not linkify invalid permlinks', () => {
      const content = '@author/invalid_permlink'
      const result = linkify(content, false)

      // Invalid permlink should not be linkified
      expect(result).toBe(content)
    })
  })

  describe('image linkification', () => {
    it('should convert image URLs to HTML', () => {
      const content = 'https://example.com/image.jpg'
      const result = linkify(content, false)

      expect(result).toContain('<img')
      expect(result).toContain('src="https://images.ecency.com')
    })

    it('should handle PNG images', () => {
      const content = 'https://example.com/photo.png'
      const result = linkify(content, false)

      expect(result).toContain('<img')
    })

    it('should handle GIF images', () => {
      const content = 'https://example.com/animation.gif'
      const result = linkify(content, false)

      expect(result).toContain('<img')
    })

    it('should handle WebP images', () => {
      const content = 'https://example.com/image.webp'
      const result = linkify(content, false)

      expect(result).toContain('<img')
    })

    it('should convert multiple image URLs', () => {
      const content = 'https://example.com/first.jpg and https://example.com/second.jpg'
      const result = linkify(content, false)

      // Both images should be converted
      expect(result).toContain('<img')
      expect(result).toContain('images.ecency.com')
    })

    it('should always use match format regardless of webp flag', () => {
      const content = 'https://example.com/image.jpg'
      const result = linkify(content, false)

      expect(result).toContain('format=match')
    })

    it('should use match format when webp=false', () => {
      const content = 'https://example.com/image.jpg'
      const result = linkify(content, false)

      expect(result).toContain('format=match')
    })
  })

  describe('security - XSS prevention', () => {
    it('should not linkify invalid hashtags', () => {
      const content = '#<invalid>'
      const result = linkify(content, false)

      // Should not create a link for invalid tag
      expect(result).not.toContain('class="markdown-tag-link"')
    })

    it('should handle usernames with special characters', () => {
      const content = '@user test content'
      const result = linkify(content, false)

      // Valid username should be linkified
      expect(result).toContain('class="markdown-author-link"')
      expect(result).toContain('href="/@user"')
    })

    it('should sanitize permlinks with special characters', () => {
      const content = '@author/<script>alert(1)</script>'
      const result = linkify(content, false)

      // Invalid permlink should not be processed as a valid post link
      expect(result).not.toContain('class="markdown-post-link"')
    })
  })

  describe('mixed content', () => {
    it('should handle hashtags and mentions together', () => {
      const content = '@alice wrote about #bitcoin'
      const result = linkify(content, false)

      expect(result).toContain('class="markdown-author-link"')
      expect(result).toContain('href="/@alice"')
      expect(result).toContain('class="markdown-tag-link"')
      expect(result).toContain('href="/trending/bitcoin"')
    })

    it('should handle mentions and post links', () => {
      const content = '@alice check @bob/my-article'
      const result = linkify(content, false)

      expect(result).toContain('href="/@alice"')
      expect(result).toContain('href="/post/@bob/my-article"')
    })

    it('should handle all types of content together', () => {
      const content = '@user wrote about #crypto in /@author/post with https://example.com/image.jpg'
      const result = linkify(content, false)

      expect(result).toContain('markdown-author-link')
      expect(result).toContain('markdown-tag-link')
      expect(result).toContain('markdown-post-link')
      expect(result).toContain('<img')
    })
  })

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = linkify('', false)
      expect(result).toBe('')
    })

    it('should handle content with no linkifiable items', () => {
      const content = 'Just plain text with no special content'
      const result = linkify(content, false)
      expect(result).toBe(content)
    })

    it('should handle multiple spaces', () => {
      const content = '   @user   #tag   '
      const result = linkify(content, false)

      expect(result).toContain('markdown-author-link')
      expect(result).toContain('markdown-tag-link')
    })

    it('should handle newlines', () => {
      const content = '@user\n#tag'
      const result = linkify(content, false)

      expect(result).toContain('markdown-author-link')
      expect(result).toContain('markdown-tag-link')
    })

    it('should handle very long content', () => {
      const content = 'a'.repeat(10000) + ' @user #tag'
      const result = linkify(content, false)

      expect(result).toContain('markdown-author-link')
      expect(result).toContain('markdown-tag-link')
    })
  })
})
