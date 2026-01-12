import { sanitizeHtml } from './methods/sanitize-html.method'

describe('sanitizeHtml', () => {
  it('1- should allow video tag with src and controls', () => {
    const input = '<video src="https://example.com/video.mp4" controls></video>'
    const expected = '<video src="https://example.com/video.mp4" controls></video>'
    expect(sanitizeHtml(input)).toBe(expected)
  })

  it('2- should strip dangerous video src', () => {
    const input = "<video src=\"javascript:alert('XSS')\" controls></video>"
    const expected = '<video controls></video>'
    expect(sanitizeHtml(input)).toBe(expected)
  })
})
