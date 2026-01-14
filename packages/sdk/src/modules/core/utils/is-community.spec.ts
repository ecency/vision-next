import { describe, it, expect } from 'vitest'
import { isCommunity } from './is-community'

describe('isCommunity', () => {
  describe('with valid community patterns', () => {
    it('should return true for valid community ID', () => {
      expect(isCommunity('hive-123456')).toBe(true)
    })

    it('should return true for single digit community', () => {
      expect(isCommunity('hive-1')).toBe(true)
    })

    it('should return true for large community ID', () => {
      expect(isCommunity('hive-999999999')).toBe(true)
    })

    it('should return true for common community patterns', () => {
      const validCommunities = [
        'hive-125125',
        'hive-196037',
        'hive-194913',
        'hive-174578',
      ]
      validCommunities.forEach(community => {
        expect(isCommunity(community)).toBe(true)
      })
    })
  })

  describe('with invalid patterns', () => {
    it('should return false for missing hive prefix', () => {
      expect(isCommunity('123456')).toBe(false)
    })

    it('should return false for wrong prefix', () => {
      expect(isCommunity('steem-123456')).toBe(false)
    })

    it('should return false for missing dash', () => {
      expect(isCommunity('hive123456')).toBe(false)
    })

    it('should return false for non-numeric suffix', () => {
      expect(isCommunity('hive-abc')).toBe(false)
    })

    it('should return false for mixed alphanumeric suffix', () => {
      expect(isCommunity('hive-123abc')).toBe(false)
    })

    it('should return false for extra characters', () => {
      expect(isCommunity('hive-123456-extra')).toBe(false)
    })

    it('should accept leading zeros (regex allows it)', () => {
      // The regex /^hive-\d+$/ actually accepts leading zeros
      expect(isCommunity('hive-00123')).toBe(true)
    })

    it('should return false for negative numbers', () => {
      expect(isCommunity('hive--123')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isCommunity('')).toBe(false)
    })

    it('should return false for username format', () => {
      expect(isCommunity('@username')).toBe(false)
    })
  })

  describe('with non-string inputs', () => {
    it('should return false for null', () => {
      expect(isCommunity(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isCommunity(undefined)).toBe(false)
    })

    it('should return false for number', () => {
      expect(isCommunity(123456)).toBe(false)
    })

    it('should return false for object', () => {
      expect(isCommunity({ name: 'hive-123456' })).toBe(false)
    })

    it('should return false for array', () => {
      expect(isCommunity(['hive-123456'])).toBe(false)
    })

    it('should return false for boolean', () => {
      expect(isCommunity(true)).toBe(false)
    })
  })
})
