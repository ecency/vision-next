import { describe, it, expect } from 'vitest'
import { encodeObj, decodeObj } from './decoder-encoder'

describe('encoder-decoder', () => {
  describe('encodeObj', () => {
    it('should encode simple object', () => {
      const obj = { name: 'test', value: 123 }
      const encoded = encodeObj(obj)
      expect(typeof encoded).toBe('string')
      expect(encoded).toMatchSnapshot()
    })

    it('should encode nested object', () => {
      const obj = {
        user: { name: 'john', profile: { age: 30 } },
        settings: { theme: 'dark' }
      }
      const encoded = encodeObj(obj)
      expect(typeof encoded).toBe('string')
      expect(encoded).toMatchSnapshot()
    })

    it('should encode array', () => {
      const obj = { items: [1, 2, 3, 4, 5] }
      const encoded = encodeObj(obj)
      expect(typeof encoded).toBe('string')
      expect(encoded).toMatchSnapshot()
    })

    it('should encode empty object', () => {
      const obj = {}
      const encoded = encodeObj(obj)
      expect(typeof encoded).toBe('string')
      expect(encoded).toMatchSnapshot()
    })

    it('should encode object with special characters', () => {
      const obj = { text: 'Hello "World" & <tag>' }
      const encoded = encodeObj(obj)
      expect(typeof encoded).toBe('string')
      expect(encoded).toMatchSnapshot()
    })

    it('should encode object with null values', () => {
      const obj = { value: null, other: 'test' }
      const encoded = encodeObj(obj)
      expect(typeof encoded).toBe('string')
      expect(encoded).toMatchSnapshot()
    })

    it('should encode object with boolean values', () => {
      const obj = { isActive: true, isDeleted: false }
      const encoded = encodeObj(obj)
      expect(typeof encoded).toBe('string')
      expect(encoded).toMatchSnapshot()
    })
  })

  describe('decodeObj', () => {
    it('should decode simple object', () => {
      const obj = { name: 'test', value: 123 }
      const encoded = encodeObj(obj)
      const decoded = decodeObj(encoded)
      expect(decoded).toEqual(obj)
    })

    it('should decode nested object', () => {
      const obj = {
        user: { name: 'john', profile: { age: 30 } },
        settings: { theme: 'dark' }
      }
      const encoded = encodeObj(obj)
      const decoded = decodeObj(encoded)
      expect(decoded).toEqual(obj)
    })

    it('should decode array', () => {
      const obj = { items: [1, 2, 3, 4, 5] }
      const encoded = encodeObj(obj)
      const decoded = decodeObj(encoded)
      expect(decoded).toEqual(obj)
    })

    it('should decode empty object', () => {
      const obj = {}
      const encoded = encodeObj(obj)
      const decoded = decodeObj(encoded)
      expect(decoded).toEqual(obj)
    })

    it('should decode object with special characters', () => {
      const obj = { text: 'Hello "World" & <tag>' }
      const encoded = encodeObj(obj)
      const decoded = decodeObj(encoded)
      expect(decoded).toEqual(obj)
    })

    it('should return undefined for invalid base64', () => {
      const result = decodeObj('SGVsbG8gV29ybGQ=') // "Hello World" in base64, not JSON object
      expect(result).toBeUndefined()
    })

    it('should return undefined for non-object JSON', () => {
      const encoded = btoa('"just a string"')
      const result = decodeObj(encoded)
      expect(result).toBeUndefined()
    })
  })

  describe('encode-decode round trip', () => {
    it('should correctly round trip simple object', () => {
      const obj = { foo: 'bar' }
      const encoded = encodeObj(obj)
      const decoded = decodeObj(encoded)
      expect(decoded).toEqual(obj)
    })

    it('should correctly round trip nested object', () => {
      const obj = { a: { b: { c: 'deep' } } }
      const encoded = encodeObj(obj)
      const decoded = decodeObj(encoded)
      expect(decoded).toEqual(obj)
    })

    it('should correctly round trip array values', () => {
      const obj = { nums: [1, 2, 3], strs: ['a', 'b'] }
      const encoded = encodeObj(obj)
      const decoded = decodeObj(encoded)
      expect(decoded).toEqual(obj)
    })

    it('should correctly round trip mixed types', () => {
      const obj = { str: 'text', num: 42, bool: true, nil: null }
      const encoded = encodeObj(obj)
      const decoded = decodeObj(encoded)
      expect(decoded).toEqual(obj)
    })

    // Skip unicode test as btoa/atob in Node don't handle unicode well
    // In browser environment, this would need TextEncoder/TextDecoder
  })
})
