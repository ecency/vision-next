import { p } from './p.method'
import { DOMParser } from '../consts'

describe('p() method - Paragraph Processing', () => {
  let doc: Document

  beforeEach(() => {
    doc = DOMParser.parseFromString('<html><body></body></html>', 'text/html')
  })

  describe('dir attribute handling', () => {
    it('should set dir="auto" on paragraph without dir attribute', () => {
      const el = doc.createElement('p')
      el.textContent = 'Hello world'

      p(el)

      expect(el.getAttribute('dir')).toBe('auto')
    })

    it('should preserve existing dir attribute', () => {
      const el = doc.createElement('p')
      el.setAttribute('dir', 'ltr')
      el.textContent = 'Left to right text'

      p(el)

      expect(el.getAttribute('dir')).toBe('ltr')
    })

    it('should preserve dir="rtl" attribute', () => {
      const el = doc.createElement('p')
      el.setAttribute('dir', 'rtl')
      el.textContent = 'مرحبا بالعالم'

      p(el)

      expect(el.getAttribute('dir')).toBe('rtl')
    })

    it('should preserve dir="auto" if already set', () => {
      const el = doc.createElement('p')
      el.setAttribute('dir', 'auto')
      el.textContent = 'Mixed content'

      p(el)

      expect(el.getAttribute('dir')).toBe('auto')
    })
  })

  describe('paragraph content handling', () => {
    it('should set dir="auto" on empty paragraph', () => {
      const el = doc.createElement('p')

      p(el)

      expect(el.getAttribute('dir')).toBe('auto')
    })

    it('should set dir="auto" on paragraph with nested elements', () => {
      const el = doc.createElement('p')
      const strong = doc.createElement('strong')
      strong.textContent = 'Bold text'
      el.appendChild(strong)

      p(el)

      expect(el.getAttribute('dir')).toBe('auto')
    })

    it('should set dir="auto" on paragraph with only whitespace', () => {
      const el = doc.createElement('p')
      el.textContent = '   \n\t   '

      p(el)

      expect(el.getAttribute('dir')).toBe('auto')
    })
  })

  describe('edge cases', () => {
    it('should handle paragraph with special characters', () => {
      const el = doc.createElement('p')
      el.textContent = '🎉 Special chars & symbols!'

      p(el)

      expect(el.getAttribute('dir')).toBe('auto')
    })

    it('should handle paragraph with RTL characters', () => {
      const el = doc.createElement('p')
      el.textContent = 'العربية'

      p(el)

      expect(el.getAttribute('dir')).toBe('auto')
    })

    it('should handle paragraph with mixed LTR/RTL content', () => {
      const el = doc.createElement('p')
      el.textContent = 'Hello مرحبا World'

      p(el)

      expect(el.getAttribute('dir')).toBe('auto')
    })

    it('should throw on null element', () => {
      expect(() => p(null as any)).toThrow()
    })

    it('should handle multiple nested elements', () => {
      const el = doc.createElement('p')
      const span1 = doc.createElement('span')
      span1.textContent = 'First'
      const span2 = doc.createElement('span')
      span2.textContent = 'Second'
      el.appendChild(span1)
      el.appendChild(span2)

      p(el)

      expect(el.getAttribute('dir')).toBe('auto')
    })
  })
})
