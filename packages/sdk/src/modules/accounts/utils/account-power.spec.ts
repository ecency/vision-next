import { describe, it, expect, vi, beforeEach } from 'vitest'
import { powerRechargeTime, votingValue } from './account-power'
import { FullAccount } from '../types'
import { DynamicProps } from '@/modules/core/types'

describe('account-power utilities', () => {
  describe('powerRechargeTime', () => {
    it('should calculate recharge time for 50% power', () => {
      const result = powerRechargeTime(50)
      expect(result).toBe(216000) // 50% missing * 100 * 432000 / 10000 = 216000 seconds
    })

    it('should calculate recharge time for 90% power', () => {
      const result = powerRechargeTime(90)
      expect(result).toBe(43200) // 10% missing * 100 * 432000 / 10000 = 43200 seconds
    })

    it('should return 0 for 100% power', () => {
      const result = powerRechargeTime(100)
      expect(result).toBe(0)
    })

    it('should calculate full recharge time for 0% power', () => {
      const result = powerRechargeTime(0)
      expect(result).toBe(432000) // 100% missing * 100 * 432000 / 10000 = 432000 seconds (5 days)
    })

    it('should handle decimal power values', () => {
      const result = powerRechargeTime(75.5)
      expect(result).toBe(105840) // 24.5% missing
    })

    it('should throw TypeError for non-finite power', () => {
      expect(() => powerRechargeTime(Infinity)).toThrow(TypeError)
      expect(() => powerRechargeTime(NaN)).toThrow(TypeError)
    })

    it('should throw RangeError for negative power', () => {
      expect(() => powerRechargeTime(-1)).toThrow(RangeError)
    })

    it('should throw RangeError for power above 100', () => {
      expect(() => powerRechargeTime(101)).toThrow(RangeError)
    })
  })

  describe('votingValue', () => {
    const mockAccount: FullAccount = {
      vesting_shares: '1000000.000000 VESTS',
      received_vesting_shares: '500000.000000 VESTS',
      delegated_vesting_shares: '100000.000000 VESTS',
      name: 'testuser',
      voting_power: 10000
    } as FullAccount

    const mockDynamicProps: DynamicProps = {
      fundRecentClaims: 1000000000,
      fundRewardBalance: 500000,
      base: 0.5,
      quote: 1.0
    } as DynamicProps

    it('should calculate voting value with default weight', () => {
      const result = votingValue(mockAccount, mockDynamicProps, 100)
      expect(result).toBeGreaterThan(0)
      expect(Number.isFinite(result)).toBe(true)
    })

    it('should calculate voting value with custom weight', () => {
      const result = votingValue(mockAccount, mockDynamicProps, 100, 5000)
      expect(result).toBeGreaterThan(0)
      expect(Number.isFinite(result)).toBe(true)
    })

    it('should return 0 for non-finite votingPowerValue', () => {
      expect(votingValue(mockAccount, mockDynamicProps, Infinity)).toBe(0)
      expect(votingValue(mockAccount, mockDynamicProps, NaN)).toBe(0)
    })

    it('should return 0 for non-finite weight', () => {
      expect(votingValue(mockAccount, mockDynamicProps, 100, Infinity)).toBe(0)
      expect(votingValue(mockAccount, mockDynamicProps, 100, NaN)).toBe(0)
    })

    it('should return 0 for zero fundRecentClaims', () => {
      const props = { ...mockDynamicProps, fundRecentClaims: 0 }
      const result = votingValue(mockAccount, props, 100)
      expect(result).toBe(0)
    })

    it('should return 0 for zero quote', () => {
      const props = { ...mockDynamicProps, quote: 0 }
      const result = votingValue(mockAccount, props, 100)
      expect(result).toBe(0)
    })

    it('should return 0 for invalid dynamic props', () => {
      const invalidProps = {
        fundRecentClaims: NaN,
        fundRewardBalance: 500000,
        base: 0.5,
        quote: 1.0
      } as DynamicProps
      const result = votingValue(mockAccount, invalidProps, 100)
      expect(result).toBe(0)
    })

    it('should handle malformed asset strings', () => {
      const badAccount = {
        ...mockAccount,
        vesting_shares: 'invalid format'
      }
      const result = votingValue(badAccount, mockDynamicProps, 100)
      expect(result).toBe(0)
    })

    it('should calculate lower value for lower voting power', () => {
      const value100 = votingValue(mockAccount, mockDynamicProps, 100)
      const value50 = votingValue(mockAccount, mockDynamicProps, 50)
      expect(value50).toBeLessThan(value100)
      expect(value50).toBeGreaterThan(0)
    })

    it('should calculate higher value for more vesting shares', () => {
      const smallAccount = {
        ...mockAccount,
        vesting_shares: '100000.000000 VESTS',
        received_vesting_shares: '0.000000 VESTS',
        delegated_vesting_shares: '0.000000 VESTS'
      }
      const smallValue = votingValue(smallAccount, mockDynamicProps, 100)
      const largeValue = votingValue(mockAccount, mockDynamicProps, 100)
      expect(largeValue).toBeGreaterThan(smallValue)
    })
  })
})
