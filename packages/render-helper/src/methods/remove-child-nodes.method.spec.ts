import { removeChildNodes } from './remove-child-nodes.method'
import { DOMParser } from '../consts'

describe('removeChildNodes() method - Child Node Removal', () => {
  let doc: Document

  beforeEach(() => {
    doc = DOMParser.parseFromString('<html><body></body></html>', 'text/html')
  })

  describe('basic removal', () => {
    it('should remove all child nodes from element', () => {
      const parent = doc.createElement('div')
      const child1 = doc.createElement('p')
      const child2 = doc.createElement('span')
      const child3 = doc.createElement('a')
      parent.appendChild(child1)
      parent.appendChild(child2)
      parent.appendChild(child3)

      expect(parent.childNodes.length).toBe(3)

      removeChildNodes(parent)

      expect(parent.childNodes.length).toBe(0)
    })

    it('should remove text nodes', () => {
      const parent = doc.createElement('div')
      const textNode = doc.createTextNode('Hello world')
      parent.appendChild(textNode)

      expect(parent.childNodes.length).toBe(1)

      removeChildNodes(parent)

      expect(parent.childNodes.length).toBe(0)
      expect(parent.textContent).toBe('')
    })

    it('should remove mixed text and element nodes', () => {
      const parent = doc.createElement('div')
      parent.appendChild(doc.createTextNode('Start '))
      const span = doc.createElement('span')
      span.textContent = 'middle'
      parent.appendChild(span)
      parent.appendChild(doc.createTextNode(' end'))

      expect(parent.childNodes.length).toBe(3)

      removeChildNodes(parent)

      expect(parent.childNodes.length).toBe(0)
    })

    it('should remove deeply nested structures', () => {
      const parent = doc.createElement('div')
      const child = doc.createElement('div')
      const grandchild = doc.createElement('span')
      grandchild.textContent = 'Nested'
      child.appendChild(grandchild)
      parent.appendChild(child)

      expect(parent.childNodes.length).toBe(1)

      removeChildNodes(parent)

      expect(parent.childNodes.length).toBe(0)
    })
  })

  describe('empty element handling', () => {
    it('should handle element with no children', () => {
      const parent = doc.createElement('div')

      expect(parent.childNodes.length).toBe(0)

      removeChildNodes(parent)

      expect(parent.childNodes.length).toBe(0)
    })

    it('should not throw when removing from empty element', () => {
      const parent = doc.createElement('div')

      expect(() => removeChildNodes(parent)).not.toThrow()
    })
  })

  describe('different node types', () => {
    it('should remove comment nodes', () => {
      const parent = doc.createElement('div')
      const comment = doc.createComment('This is a comment')
      parent.appendChild(comment)

      expect(parent.childNodes.length).toBe(1)

      removeChildNodes(parent)

      expect(parent.childNodes.length).toBe(0)
    })

    it('should remove multiple different node types', () => {
      const parent = doc.createElement('div')
      parent.appendChild(doc.createTextNode('Text'))
      parent.appendChild(doc.createElement('div'))
      parent.appendChild(doc.createComment('Comment'))
      const span = doc.createElement('span')
      span.textContent = 'Span'
      parent.appendChild(span)

      expect(parent.childNodes.length).toBe(4)

      removeChildNodes(parent)

      expect(parent.childNodes.length).toBe(0)
    })
  })

  describe('performance and stability', () => {
    it('should handle large number of children', () => {
      const parent = doc.createElement('div')

      // Add 100 children
      for (let i = 0; i < 100; i++) {
        const child = doc.createElement('div')
        child.textContent = `Child ${i}`
        parent.appendChild(child)
      }

      expect(parent.childNodes.length).toBe(100)

      removeChildNodes(parent)

      expect(parent.childNodes.length).toBe(0)
    })

    it('should use stable removal avoiding live collection issues', () => {
      const parent = doc.createElement('div')

      // Add several children
      for (let i = 0; i < 10; i++) {
        const child = doc.createElement('span')
        child.textContent = `Item ${i}`
        parent.appendChild(child)
      }

      // The implementation uses while loop with firstChild
      // This test ensures it doesn't have issues with live collections
      removeChildNodes(parent)

      expect(parent.childNodes.length).toBe(0)
      expect(parent.firstChild).toBeNull()
    })

    it('should completely clear parent innerHTML', () => {
      const parent = doc.createElement('div')
      parent.innerHTML = '<p>Test</p><span>Content</span><a>Link</a>'

      // Note: innerHTML may not work in xmldom, so we'll add manually
      const p = doc.createElement('p')
      p.textContent = 'Test'
      const span = doc.createElement('span')
      span.textContent = 'Content'
      const a = doc.createElement('a')
      a.textContent = 'Link'
      parent.appendChild(p)
      parent.appendChild(span)
      parent.appendChild(a)

      removeChildNodes(parent)

      expect(parent.childNodes.length).toBe(0)
      expect(parent.textContent).toBe('')
    })
  })

  describe('edge cases', () => {
    it('should not remove the parent element itself', () => {
      const grandparent = doc.createElement('div')
      const parent = doc.createElement('div')
      const child = doc.createElement('span')
      parent.appendChild(child)
      grandparent.appendChild(parent)

      removeChildNodes(parent)

      // Parent should still be a child of grandparent
      expect(grandparent.childNodes.length).toBe(1)
      expect(grandparent.firstChild).toBe(parent)
      // But parent's children should be gone
      expect(parent.childNodes.length).toBe(0)
    })

    it('should not affect parent attributes', () => {
      const parent = doc.createElement('div')
      parent.setAttribute('class', 'test-class')
      parent.setAttribute('id', 'test-id')
      const child = doc.createElement('span')
      parent.appendChild(child)

      removeChildNodes(parent)

      expect(parent.getAttribute('class')).toBe('test-class')
      expect(parent.getAttribute('id')).toBe('test-id')
      expect(parent.childNodes.length).toBe(0)
    })

    it('should handle removing from document fragment', () => {
      const fragment = doc.createDocumentFragment()
      const div1 = doc.createElement('div')
      const div2 = doc.createElement('div')
      fragment.appendChild(div1)
      fragment.appendChild(div2)

      expect(fragment.childNodes.length).toBe(2)

      removeChildNodes(fragment)

      expect(fragment.childNodes.length).toBe(0)
    })

    it('should throw on null or undefined', () => {
      expect(() => removeChildNodes(null as any)).toThrow()
      expect(() => removeChildNodes(undefined as any)).toThrow()
    })

    it('should clear element that can be reused', () => {
      const parent = doc.createElement('div')
      const child1 = doc.createElement('span')
      child1.textContent = 'First'
      parent.appendChild(child1)

      removeChildNodes(parent)

      // Now reuse the parent
      const child2 = doc.createElement('p')
      child2.textContent = 'Second'
      parent.appendChild(child2)

      expect(parent.childNodes.length).toBe(1)
      expect(parent.firstChild).toBe(child2)
    })
  })

  describe('real-world scenarios', () => {
    it('should clear a container before repopulating', () => {
      const container = doc.createElement('div')

      // First population
      const item1 = doc.createElement('div')
      item1.textContent = 'Item 1'
      container.appendChild(item1)

      expect(container.childNodes.length).toBe(1)

      // Clear before repopulating
      removeChildNodes(container)

      // Repopulate
      const item2 = doc.createElement('div')
      item2.textContent = 'Item 2'
      const item3 = doc.createElement('div')
      item3.textContent = 'Item 3'
      container.appendChild(item2)
      container.appendChild(item3)

      expect(container.childNodes.length).toBe(2)
      expect(container.textContent).toContain('Item 2')
      expect(container.textContent).toContain('Item 3')
      expect(container.textContent).not.toContain('Item 1')
    })

    it('should remove dynamically created content', () => {
      const parent = doc.createElement('div')

      // Simulate dynamic content creation
      for (let i = 0; i < 5; i++) {
        const p = doc.createElement('p')
        p.textContent = `Dynamic paragraph ${i}`
        parent.appendChild(p)
      }

      expect(parent.childNodes.length).toBe(5)

      removeChildNodes(parent)

      expect(parent.childNodes.length).toBe(0)
    })
  })
})
