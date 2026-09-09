import { describe, it, expect } from 'vitest'
import { powerRechargeTime, rewardsToStakeRatio, votingRshares, votingValue } from './account-power'
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
      vesting_withdraw_rate: '0.000000 VESTS',
      to_withdraw: '0',
      withdrawn: '0',
      name: 'testuser',
      voting_power: 10000,
      voting_manabar: {
        current_mana: '1400000000000',
        last_update_time: 0
      }
    } as FullAccount

    const mockDynamicProps: DynamicProps = {
      fundRecentClaims: 1000000000,
      fundRewardBalance: 500000,
      base: 0.5,
      quote: 1.0,
      votePowerReserveRate: 10,
      authorRewardCurve: 'linear',
      contentConstant: 2000000000000,
      currentHardforkVersion: '1.28.0',
      lastHardfork: 28
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

    it('should keep the same value for lower voting power on stable-vote hardforks', () => {
      const value100 = votingValue(mockAccount, mockDynamicProps, 100)
      const value50 = votingValue(mockAccount, mockDynamicProps, 50)
      expect(value50).toBe(value100)
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

    it('should return 0 when current mana is insufficient for the requested stable vote', () => {
      const lowManaAccount = {
        ...mockAccount,
        voting_manabar: {
          current_mana: '1',
          last_update_time: Math.floor(Date.now() / 1000)
        }
      }

      expect(votingValue(lowManaAccount, mockDynamicProps, 100)).toBe(0)
    })

    it('should retain legacy scaling before hardfork 1.28', () => {
      const legacyProps = {
        ...mockDynamicProps,
        currentHardforkVersion: '1.27.0',
        lastHardfork: 27
      }

      const value100 = votingValue(mockAccount, legacyProps, 100)
      const value50 = votingValue(mockAccount, legacyProps, 50)

      expect(value50).toBeLessThan(value100)
      expect(value50).toBeGreaterThan(0)
    })
  })

  describe('votingRshares', () => {
    const mockAccount: FullAccount = {
      vesting_shares: '1000000.000000 VESTS',
      received_vesting_shares: '500000.000000 VESTS',
      delegated_vesting_shares: '100000.000000 VESTS',
      vesting_withdraw_rate: '0.000000 VESTS',
      to_withdraw: '0',
      withdrawn: '0',
      name: 'testuser',
      voting_power: 10000,
      voting_manabar: {
        current_mana: '1400000000000',
        last_update_time: 0
      }
    } as FullAccount

    const stableProps: DynamicProps = {
      fundRecentClaims: 1000000000,
      fundRewardBalance: 500000,
      base: 0.5,
      quote: 1.0,
      votePowerReserveRate: 10,
      authorRewardCurve: 'linear',
      contentConstant: 2000000000000,
      currentHardforkVersion: '1.28.0',
      lastHardfork: 28
    } as DynamicProps

    it('ignores votingPowerValue on stable-vote hardforks', () => {
      const rshares100 = votingRshares(mockAccount, stableProps, 100)
      const rshares50 = votingRshares(mockAccount, stableProps, 50)
      expect(rshares50).toBe(rshares100)
    })

    it('scales with weight on stable-vote hardforks', () => {
      const full = votingRshares(mockAccount, stableProps, 100, 10000)
      const half = votingRshares(mockAccount, stableProps, 100, 5000)
      expect(half).toBeLessThan(full)
      expect(half).toBeGreaterThan(0)
    })
  })

  describe('rewardsToStakeRatio', () => {
    // Shape taken from a real curation-heavy account: most of the numerator is
    // curation earned by voting with stake other people delegated in.
    const mockAccount: FullAccount = {
      name: 'testuser',
      vesting_shares: '167349556.274622 VESTS',
      delegated_vesting_shares: '61880230.389936 VESTS',
      received_vesting_shares: '4072866315.676890 VESTS',
      curation_rewards: 749940999,
      posting_rewards: 44803179
    } as FullAccount

    it('divides lifetime rewards by undelegated own stake', () => {
      expect(rewardsToStakeRatio(mockAccount)).toBeCloseTo(7.54, 2)
    })

    it('ignores stake delegated to the account', () => {
      const withoutIncoming = { ...mockAccount, received_vesting_shares: '0.000000 VESTS' }
      expect(rewardsToStakeRatio(withoutIncoming)).toBe(rewardsToStakeRatio(mockAccount))
    })

    it('rises as own stake is delegated away', () => {
      const moreDelegated = {
        ...mockAccount,
        delegated_vesting_shares: '120000000.000000 VESTS'
      }
      expect(rewardsToStakeRatio(moreDelegated)!).toBeGreaterThan(rewardsToStakeRatio(mockAccount)!)
    })

    it('returns 0 for an account that never earned rewards', () => {
      const fresh = { ...mockAccount, curation_rewards: undefined, posting_rewards: undefined }
      expect(rewardsToStakeRatio(fresh)).toBe(0)
    })

    it('returns null when the whole stake is delegated away', () => {
      const emptied = {
        ...mockAccount,
        delegated_vesting_shares: mockAccount.vesting_shares
      }
      expect(rewardsToStakeRatio(emptied)).toBeNull()
    })

    it('returns null for an unparseable stake', () => {
      const broken = {
        ...mockAccount,
        vesting_shares: 'not-an-asset',
        delegated_vesting_shares: '0.000000 VESTS'
      } as FullAccount
      expect(rewardsToStakeRatio(broken)).toBeNull()
    })

    it('returns null when a node serves a non-numeric reward counter', () => {
      const broken = { ...mockAccount, curation_rewards: Number.NaN }
      expect(rewardsToStakeRatio(broken)).toBeNull()
    })
  })
})
