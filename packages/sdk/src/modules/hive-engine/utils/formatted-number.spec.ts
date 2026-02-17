import { describe, it, expect } from 'vitest'
import { formattedNumber } from './formatted-number'

describe('formattedNumber', () => {
  describe('default formatting', () => {
    it('should format number with default 3 fraction digits', () => {
      const result = formattedNumber(123.456)
      expect(result).toBe('123.456')
    })

    it('should format number with thousands separator', () => {
      const result = formattedNumber(1234567.89)
      expect(result).toBe('1,234,567.890')
    })

    it('should format zero correctly', () => {
      const result = formattedNumber(0)
      expect(result).toBe('0.000')
    })

    it('should format negative numbers', () => {
      const result = formattedNumber(-123.456)
      expect(result).toBe('-123.456')
    })
  })

  describe('string input', () => {
    it('should handle string numbers', () => {
      const result = formattedNumber('123.456')
      expect(result).toBe('123.456')
    })

    it('should handle string numbers with thousands', () => {
      const result = formattedNumber('1234567.89')
      expect(result).toBe('1,234,567.890')
    })
  })

  describe('custom fraction digits', () => {
    it.each([
      [123.456789, 0, '123'],
      [123.456789, 1, '123.5'],
      [123.456789, 2, '123.46'],
      [123.456789, 4, '123.4568'],
      [123.456789, 6, '123.456789'],
    ])('should format %f with %i fraction digits as %s', (value, fractionDigits, expected) => {
      const result = formattedNumber(value, { fractionDigits })
      expect(result).toBe(expected)
    })

    it('should format with no decimals when fractionDigits is 0', () => {
      const result = formattedNumber(123.999, { fractionDigits: 0 })
      expect(result).toBe('124')
    })
  })

  describe('prefix and suffix', () => {
    it('should add prefix', () => {
      const result = formattedNumber(123.456, { prefix: '$' })
      expect(result).toBe('$ 123.456')
    })

    it('should add suffix', () => {
      const result = formattedNumber(123.456, { suffix: 'HIVE' })
      expect(result).toBe('123.456 HIVE')
    })

    it('should add both prefix and suffix', () => {
      const result = formattedNumber(123.456, { prefix: '$', suffix: 'USD' })
      expect(result).toBe('$ 123.456 USD')
    })

    it('should work with custom fraction digits and prefix/suffix', () => {
      const result = formattedNumber(1234.5678, {
        fractionDigits: 2,
        prefix: '~',
        suffix: 'tokens',
      })
      expect(result).toBe('~ 1,234.57 tokens')
    })
  })

  describe('very small values bug fix', () => {
    it('should handle very small positive values as zero', () => {
      const result = formattedNumber(0.00001)
      expect(result).toBe('0.000')
    })

    it('should handle very small negative values as zero', () => {
      const result = formattedNumber(-0.00001)
      expect(result).toBe('0.000')
    })

    it('should handle values at threshold (0.0001)', () => {
      const result = formattedNumber(0.0001)
      expect(result).toBe('0.000')
    })

    it('should handle values well above threshold', () => {
      const result = formattedNumber(0.001)
      expect(result).toBe('0.001')
    })
  })

  describe('edge cases', () => {
    it.each([
      [0, '0.000'],
      [0.001, '0.001'],
      [1, '1.000'],
      [1000, '1,000.000'],
      [1000000, '1,000,000.000'],
      [0.123456, '0.123'],
      [999999.999, '999,999.999'],
    ])('should format %f as %s', (value, expected) => {
      expect(formattedNumber(value)).toBe(expected)
    })

    it('should handle large numbers with many digits', () => {
      const result = formattedNumber(123456789.123456)
      expect(result).toBe('123,456,789.123')
    })

    it('should handle decimal-only values', () => {
      const result = formattedNumber(0.999)
      expect(result).toBe('0.999')
    })
  })
})
