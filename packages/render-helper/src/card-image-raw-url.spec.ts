import { describe, expect, it } from 'vitest'
import { getEntryCardImageRawUrl, getEntryImageRawUrl } from './catch-post-image'

const entry = (json_metadata: Record<string, unknown>, body = '') =>
  ({ author: 'alice', permlink: 'p', body, json_metadata }) as never

describe('getEntryCardImageRawUrl', () => {
  // The reason this exists: catchPostImage reads json_metadata.thumbnails
  // first, getEntryImageRawUrl deliberately does not, and a caller that
  // classifies the card's image needs the one the card will actually request.
  it('prefers json_metadata.thumbnails, which getEntryImageRawUrl skips', () => {
    const e = entry({
      thumbnails: ['https://img.host/thumb.gif'],
      image: ['https://img.host/cover.png']
    })
    expect(getEntryCardImageRawUrl(e)).toBe('https://img.host/thumb.gif')
    expect(getEntryImageRawUrl(e)).toBe('https://img.host/cover.png')
  })

  it('falls back to json_metadata.image when there is no thumbnail', () => {
    const e = entry({ image: ['https://img.host/cover.png'] })
    expect(getEntryCardImageRawUrl(e)).toBe('https://img.host/cover.png')
  })

  it('falls back to the first body image when metadata has none', () => {
    const e = entry({}, 'text\n\n![x](https://img.host/in-body.jpg)\n')
    expect(getEntryCardImageRawUrl(e)).toBe('https://img.host/in-body.jpg')
  })

  it('returns null when the entry has no image anywhere', () => {
    expect(getEntryCardImageRawUrl(entry({}, 'just words'))).toBeNull()
  })

  it('ignores a non-string thumbnail rather than throwing on it', () => {
    const e = entry({ thumbnails: [{ url: 'nope' }], image: ['https://img.host/cover.png'] })
    expect(getEntryCardImageRawUrl(e)).toBe('https://img.host/cover.png')
  })

  it('parses json_metadata delivered as a string', () => {
    const e = {
      author: 'alice', permlink: 'p', body: '',
      json_metadata: JSON.stringify({ thumbnails: ['https://img.host/thumb.png'] })
    } as never
    expect(getEntryCardImageRawUrl(e)).toBe('https://img.host/thumb.png')
  })
})
