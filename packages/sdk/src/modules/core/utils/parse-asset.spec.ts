import { describe, it, expect } from 'vitest'
import { parseAsset, Symbol, NaiMap } from './parse-asset'

describe('parseAsset', () => {
  describe('with string input', () => {
    it('should parse HIVE asset string', () => {
      const result = parseAsset('100.000 HIVE')
      expect(result).toMatchSnapshot()
      expect(result.amount).toBe(100)
      expect(result.symbol).toBe(Symbol.HIVE)
    })

    it('should parse HBD asset string', () => {
      const result = parseAsset('50.500 HBD')
      expect(result).toMatchSnapshot()
      expect(result.amount).toBe(50.5)
      expect(result.symbol).toBe(Symbol.HBD)
    })

    it('should parse VESTS asset string', () => {
      const result = parseAsset('1234567.890123 VESTS')
      expect(result).toMatchSnapshot()
      expect(result.amount).toBe(1234567.890123)
      expect(result.symbol).toBe(Symbol.VESTS)
    })

    it('should handle zero amounts', () => {
      const result = parseAsset('0.000 HIVE')
      expect(result.amount).toBe(0)
      expect(result.symbol).toBe(Symbol.HIVE)
    })

    it('should handle negative amounts', () => {
      const result = parseAsset('-10.500 HBD')
      expect(result.amount).toBe(-10.5)
      expect(result.symbol).toBe(Symbol.HBD)
    })

    it('should handle very small amounts', () => {
      const result = parseAsset('0.001 HIVE')
      expect(result.amount).toBe(0.001)
      expect(result.symbol).toBe(Symbol.HIVE)
    })

    it('should handle very large amounts', () => {
      const result = parseAsset('999999999.999 HIVE')
      expect(result.amount).toBe(999999999.999)
      expect(result.symbol).toBe(Symbol.HIVE)
    })
  })

  describe('with SMTAsset input', () => {
    it('should parse HIVE NAI asset', () => {
      const result = parseAsset({
        amount: 100000,
        precision: 3,
        nai: '@@000000021'
      })
      expect(result).toMatchSnapshot()
      expect(result.amount).toBe(100)
      expect(result.symbol).toBe('HIVE')
    })

    it('should parse HBD NAI asset', () => {
      const result = parseAsset({
        amount: 50500,
        precision: 3,
        nai: '@@000000013'
      })
      expect(result).toMatchSnapshot()
      expect(result.amount).toBe(50.5)
      expect(result.symbol).toBe('HBD')
    })

    it('should parse VESTS NAI asset', () => {
      const result = parseAsset({
        amount: 123456789012,
        precision: 6,
        nai: '@@000000037'
      })
      expect(result).toMatchSnapshot()
      expect(result.amount).toBe(123456.789012)
      expect(result.symbol).toBe('VESTS')
    })

    it('should handle zero precision', () => {
      const result = parseAsset({
        amount: 100,
        precision: 0,
        nai: '@@000000021'
      })
      expect(result.amount).toBe(100)
      expect(result.symbol).toBe('HIVE')
    })

    it('should handle high precision', () => {
      const result = parseAsset({
        amount: 123456789,
        precision: 6,
        nai: '@@000000037'
      })
      expect(result.amount).toBe(123.456789)
      expect(result.symbol).toBe('VESTS')
    })
  })
})
