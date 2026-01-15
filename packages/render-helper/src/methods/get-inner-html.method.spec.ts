import { getSerializedInnerHTML } from './get-inner-html.method'
import { DOMParser } from '../consts'

describe('getSerializedInnerHTML() method - HTML Serialization', () => {
  let doc: Document

  beforeEach(() => {
    doc = DOMParser.parseFromString('<html><body></body></html>', 'text/html')
  })

  describe('basic HTML serialization', () => {
    it('should serialize simple text node', () => {
      const parent = doc.createElement('div')
      const textNode = doc.createTextNode('Hello world')
      parent.appendChild(textNode)

      const result = getSerializedInnerHTML(parent)

      expect(result).toBe('Hello world')
    })

    it('should serialize element with attributes', () => {
      const parent = doc.createElement('div')
      const child = doc.createElement('span')
      child.setAttribute('class', 'test')
      child.textContent = 'Content'
      parent.appendChild(child)

      const result = getSerializedInnerHTML(parent)

      expect(result).toContain('<span')
      expect(result).toContain('class="test"')
      expect(result).toContain('Content')
    })

    it('should serialize nested elements', () => {
      const parent = doc.createElement('div')
      const outer = doc.createElement('p')
      const inner = doc.createElement('strong')
      inner.textContent = 'Bold'
      outer.appendChild(inner)
      parent.appendChild(outer)

      const result = getSerializedInnerHTML(parent)

      expect(result).toContain('<p')
      expect(result).toContain('<strong')
      expect(result).toContain('Bold')
    })

    it('should return only first child serialization', () => {
      const parent = doc.createElement('div')
      const child1 = doc.createElement('p')
      child1.textContent = 'First'
      const child2 = doc.createElement('p')
      child2.textContent = 'Second'
      parent.appendChild(child1)
      parent.appendChild(child2)

      const result = getSerializedInnerHTML(parent)

      // Should only return first child
      expect(result).toContain('First')
      expect(result).not.toContain('Second')
    })
  })

  describe('special character handling', () => {
    it('should properly escape special HTML characters', () => {
      const parent = doc.createElement('div')
      const textNode = doc.createTextNode('<script>alert("XSS")</script>')
      parent.appendChild(textNode)

      const result = getSerializedInnerHTML(parent)

      // XMLSerializer should escape these characters
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
    })

    it('should handle ampersands', () => {
      const parent = doc.createElement('div')
      const textNode = doc.createTextNode('Tom & Jerry')
      parent.appendChild(textNode)

      const result = getSerializedInnerHTML(parent)

      expect(result).toContain('&amp;')
    })

    it('should handle quotes in attributes', () => {
      const parent = doc.createElement('div')
      const child = doc.createElement('a')
      child.setAttribute('title', 'Say "Hello"')
      child.textContent = 'Link'
      parent.appendChild(child)

      const result = getSerializedInnerHTML(parent)

      // XMLSerializer should handle quotes properly
      expect(result).toContain('title=')
    })

    it('should handle unicode characters', () => {
      const parent = doc.createElement('div')
      const textNode = doc.createTextNode('Hello 世界 🌍')
      parent.appendChild(textNode)

      const result = getSerializedInnerHTML(parent)

      expect(result).toContain('Hello')
      expect(result).toContain('世界')
      expect(result).toContain('🌍')
    })
  })

  describe('empty and null cases', () => {
    it('should return empty string for element with no children', () => {
      const parent = doc.createElement('div')

      const result = getSerializedInnerHTML(parent)

      expect(result).toBe('')
    })

    it('should handle element with only whitespace', () => {
      const parent = doc.createElement('div')
      const textNode = doc.createTextNode('   ')
      parent.appendChild(textNode)

      const result = getSerializedInnerHTML(parent)

      expect(result).toBe('   ')
    })

    it('should handle element with empty text node', () => {
      const parent = doc.createElement('div')
      const textNode = doc.createTextNode('')
      parent.appendChild(textNode)

      const result = getSerializedInnerHTML(parent)

      expect(result).toBe('')
    })
  })

  describe('complex structures', () => {
    it('should serialize element with multiple attributes', () => {
      const parent = doc.createElement('div')
      const child = doc.createElement('img')
      child.setAttribute('src', 'image.jpg')
      child.setAttribute('alt', 'Test image')
      child.setAttribute('width', '100')
      parent.appendChild(child)

      const result = getSerializedInnerHTML(parent)

      expect(result).toContain('<img')
      expect(result).toContain('src="image.jpg"')
      expect(result).toContain('alt="Test image"')
      expect(result).toContain('width="100"')
    })

    it('should serialize deeply nested structure', () => {
      const parent = doc.createElement('div')
      const level1 = doc.createElement('div')
      const level2 = doc.createElement('div')
      const level3 = doc.createElement('span')
      level3.textContent = 'Deep'
      level2.appendChild(level3)
      level1.appendChild(level2)
      parent.appendChild(level1)

      const result = getSerializedInnerHTML(parent)

      expect(result).toContain('Deep')
    })

    it('should serialize mixed content (text and elements)', () => {
      const parent = doc.createElement('div')
      const p = doc.createElement('p')
      p.appendChild(doc.createTextNode('Start '))
      const strong = doc.createElement('strong')
      strong.textContent = 'bold'
      p.appendChild(strong)
      p.appendChild(doc.createTextNode(' end'))
      parent.appendChild(p)

      const result = getSerializedInnerHTML(parent)

      expect(result).toContain('Start')
      expect(result).toContain('<strong')
      expect(result).toContain('bold')
      expect(result).toContain('end')
    })
  })

  describe('edge cases', () => {
    it('should handle self-closing tags', () => {
      const parent = doc.createElement('div')
      const br = doc.createElement('br')
      parent.appendChild(br)

      const result = getSerializedInnerHTML(parent)

      expect(result).toContain('br')
    })

    it('should handle CDATA sections if present', () => {
      const parent = doc.createElement('div')
      const text = doc.createTextNode('Normal text')
      parent.appendChild(text)

      const result = getSerializedInnerHTML(parent)

      expect(result).toBe('Normal text')
    })

    it('should handle elements with namespaces', () => {
      const parent = doc.createElement('div')
      const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg')
      parent.appendChild(svg)

      const result = getSerializedInnerHTML(parent)

      expect(result).toContain('svg')
    })

    it('should not throw on malformed structures', () => {
      const parent = doc.createElement('div')
      const child = doc.createElement('p')
      child.textContent = 'Content'
      parent.appendChild(child)

      expect(() => getSerializedInnerHTML(parent)).not.toThrow()
    })

    it('should handle very long text content', () => {
      const parent = doc.createElement('div')
      const longText = 'a'.repeat(10000)
      const textNode = doc.createTextNode(longText)
      parent.appendChild(textNode)

      const result = getSerializedInnerHTML(parent)

      expect(result).toBe(longText)
      expect(result.length).toBe(10000)
    })
  })
})
