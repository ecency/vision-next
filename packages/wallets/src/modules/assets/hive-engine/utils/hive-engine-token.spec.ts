import { describe, it, expect } from 'vitest'
import { HiveEngineToken } from './hive-engine-token'

describe('HiveEngineToken', () => {
  describe('constructor', () => {
    it('should create token with all properties', () => {
      const token = new HiveEngineToken({
        symbol: 'LEO',
        name: 'LEO Token',
        icon: 'https://example.com/leo.png',
        precision: 3,
        stakingEnabled: true,
        delegationEnabled: true,
        balance: '100.500',
        stake: '50.250',
        delegationsIn: '10.000',
        delegationsOut: '5.000',
        usdValue: 125.5,
      })

      expect(token.symbol).toBe('LEO')
      expect(token.name).toBe('LEO Token')
      expect(token.icon).toBe('https://example.com/leo.png')
      expect(token.precision).toBe(3)
      expect(token.stakingEnabled).toBe(true)
      expect(token.delegationEnabled).toBe(true)
      expect(token.balance).toBe(100.5)
      expect(token.stake).toBe(50.25)
      expect(token.delegationsIn).toBe(10)
      expect(token.delegationsOut).toBe(5)
      expect(token.stakedBalance).toBe(55.25) // 50.25 + 10 - 5
      expect(token.usdValue).toBe(125.5)
      expect(token).toMatchSnapshot()
    })

    it('should handle missing optional fields with defaults', () => {
      const token = new HiveEngineToken({
        symbol: 'TEST',
        name: '',
        icon: '',
        precision: 0,
        stakingEnabled: false,
        delegationEnabled: false,
        balance: '0',
        stake: '0',
        delegationsIn: '0',
        delegationsOut: '0',
        usdValue: 0,
      })

      expect(token.symbol).toBe('TEST')
      expect(token.name).toBe('')
      expect(token.icon).toBe('')
      expect(token.precision).toBe(0)
      expect(token.stakingEnabled).toBe(false)
      expect(token.delegationEnabled).toBe(false)
      expect(token).toMatchSnapshot()
    })

    it('should parse string numbers correctly', () => {
      const token = new HiveEngineToken({
        symbol: 'HIVE',
        name: 'Hive',
        icon: '',
        precision: 3,
        stakingEnabled: false,
        delegationEnabled: false,
        balance: '1234.567',
        stake: '890.123',
        delegationsIn: '100.500',
        delegationsOut: '50.250',
        usdValue: 0,
      })

      expect(token.balance).toBe(1234.567)
      expect(token.stake).toBe(890.123)
      expect(token.delegationsIn).toBe(100.5)
      expect(token.delegationsOut).toBe(50.25)
    })

    it('should calculate stakedBalance correctly', () => {
      const token = new HiveEngineToken({
        symbol: 'SPK',
        name: 'SPK Token',
        icon: '',
        precision: 3,
        stakingEnabled: true,
        delegationEnabled: true,
        balance: '0',
        stake: '100',
        delegationsIn: '50',
        delegationsOut: '25',
        usdValue: 0,
      })

      expect(token.stakedBalance).toBe(125) // 100 + 50 - 25
    })
  })

  describe('hasDelegations', () => {
    it('should return true when delegations are enabled and have both in and out', () => {
      const token = new HiveEngineToken({
        symbol: 'LEO',
        name: 'LEO',
        icon: '',
        precision: 3,
        stakingEnabled: true,
        delegationEnabled: true,
        balance: '0',
        stake: '100',
        delegationsIn: '10',
        delegationsOut: '5',
        usdValue: 0,
      })

      expect(token.hasDelegations()).toBe(true)
    })

    it('should return false when delegations are disabled', () => {
      const token = new HiveEngineToken({
        symbol: 'TEST',
        name: 'Test',
        icon: '',
        precision: 3,
        stakingEnabled: true,
        delegationEnabled: false,
        balance: '0',
        stake: '100',
        delegationsIn: '10',
        delegationsOut: '5',
        usdValue: 0,
      })

      expect(token.hasDelegations()).toBe(false)
    })

    it('should return false when no delegations in', () => {
      const token = new HiveEngineToken({
        symbol: 'LEO',
        name: 'LEO',
        icon: '',
        precision: 3,
        stakingEnabled: true,
        delegationEnabled: true,
        balance: '0',
        stake: '100',
        delegationsIn: '0',
        delegationsOut: '5',
        usdValue: 0,
      })

      expect(token.hasDelegations()).toBe(false)
    })

    it('should return false when no delegations out', () => {
      const token = new HiveEngineToken({
        symbol: 'LEO',
        name: 'LEO',
        icon: '',
        precision: 3,
        stakingEnabled: true,
        delegationEnabled: true,
        balance: '0',
        stake: '100',
        delegationsIn: '10',
        delegationsOut: '0',
        usdValue: 0,
      })

      expect(token.hasDelegations()).toBe(false)
    })
  })

  describe('delegations', () => {
    it('should return formatted delegation string when has delegations', () => {
      const token = new HiveEngineToken({
        symbol: 'LEO',
        name: 'LEO',
        icon: '',
        precision: 3,
        stakingEnabled: true,
        delegationEnabled: true,
        balance: '0',
        stake: '100.500',
        delegationsIn: '25.250',
        delegationsOut: '10.125',
        usdValue: 0,
      })

      const result = token.delegations()
      expect(result).toBe('(100.500 + 25.250 - 10.125)')
      expect(result).toMatchSnapshot()
    })

    it('should return empty string when no delegations', () => {
      const token = new HiveEngineToken({
        symbol: 'TEST',
        name: 'Test',
        icon: '',
        precision: 3,
        stakingEnabled: true,
        delegationEnabled: true,
        balance: '0',
        stake: '100',
        delegationsIn: '0',
        delegationsOut: '0',
        usdValue: 0,
      })

      expect(token.delegations()).toBe('')
    })

    it('should respect precision in delegation formatting', () => {
      const token = new HiveEngineToken({
        symbol: 'SPK',
        name: 'SPK',
        icon: '',
        precision: 8,
        stakingEnabled: true,
        delegationEnabled: true,
        balance: '0',
        stake: '100.12345678',
        delegationsIn: '25.87654321',
        delegationsOut: '10.11111111',
        usdValue: 0,
      })

      const result = token.delegations()
      expect(result).toContain('100.12345678')
      expect(result).toContain('25.87654321')
      expect(result).toContain('10.11111111')
    })
  })

  describe('staked', () => {
    it('should return formatted staked balance when staking enabled', () => {
      const token = new HiveEngineToken({
        symbol: 'LEO',
        name: 'LEO',
        icon: '',
        precision: 3,
        stakingEnabled: true,
        delegationEnabled: false,
        balance: '0',
        stake: '100.500',
        delegationsIn: '0',
        delegationsOut: '0',
        usdValue: 0,
      })

      expect(token.staked()).toBe('100.500')
      expect(token.staked()).toMatchSnapshot()
    })

    it('should return "-" when staking is disabled', () => {
      const token = new HiveEngineToken({
        symbol: 'TEST',
        name: 'Test',
        icon: '',
        precision: 3,
        stakingEnabled: false,
        delegationEnabled: false,
        balance: '100',
        stake: '50',
        delegationsIn: '0',
        delegationsOut: '0',
        usdValue: 0,
      })

      expect(token.staked()).toBe('-')
    })

    it('should return raw value when stakedBalance is very small', () => {
      const token = new HiveEngineToken({
        symbol: 'TINY',
        name: 'Tiny',
        icon: '',
        precision: 8,
        stakingEnabled: true,
        delegationEnabled: false,
        balance: '0',
        stake: '0.00001',
        delegationsIn: '0',
        delegationsOut: '0',
        usdValue: 0,
      })

      expect(token.staked()).toBe('0.00001')
    })

    it('should format with correct precision for normal values', () => {
      const token = new HiveEngineToken({
        symbol: 'SPK',
        name: 'SPK',
        icon: '',
        precision: 6,
        stakingEnabled: true,
        delegationEnabled: true,
        balance: '0',
        stake: '1000.123456',
        delegationsIn: '500.654321',
        delegationsOut: '200.111111',
        usdValue: 0,
      })

      const result = token.staked()
      expect(result).toBe('1,300.666666') // 1000.123456 + 500.654321 - 200.111111
    })
  })

  describe('balanced', () => {
    it('should return formatted balance for normal values', () => {
      const token = new HiveEngineToken({
        symbol: 'LEO',
        name: 'LEO',
        icon: '',
        precision: 3,
        stakingEnabled: false,
        delegationEnabled: false,
        balance: '1234.567',
        stake: '0',
        delegationsIn: '0',
        delegationsOut: '0',
        usdValue: 0,
      })

      expect(token.balanced()).toBe('1,234.567')
      expect(token.balanced()).toMatchSnapshot()
    })

    it('should return raw value when balance is very small', () => {
      const token = new HiveEngineToken({
        symbol: 'TINY',
        name: 'Tiny',
        icon: '',
        precision: 8,
        stakingEnabled: false,
        delegationEnabled: false,
        balance: '0.00005',
        stake: '0',
        delegationsIn: '0',
        delegationsOut: '0',
        usdValue: 0,
      })

      expect(token.balanced()).toBe('0.00005')
    })

    it('should format with correct precision', () => {
      const token = new HiveEngineToken({
        symbol: 'HIVE',
        name: 'HIVE',
        icon: '',
        precision: 3,
        stakingEnabled: false,
        delegationEnabled: false,
        balance: '99999.999',
        stake: '0',
        delegationsIn: '0',
        delegationsOut: '0',
        usdValue: 0,
      })

      expect(token.balanced()).toBe('99,999.999')
    })

    it('should handle zero balance', () => {
      const token = new HiveEngineToken({
        symbol: 'ZERO',
        name: 'Zero',
        icon: '',
        precision: 3,
        stakingEnabled: false,
        delegationEnabled: false,
        balance: '0',
        stake: '0',
        delegationsIn: '0',
        delegationsOut: '0',
        usdValue: 0,
      })

      expect(token.balanced()).toBe('0')
    })
  })

  describe('complete token snapshots', () => {
    it('should match snapshot for fully configured token', () => {
      const token = new HiveEngineToken({
        symbol: 'LEO',
        name: 'LeoFinance',
        icon: 'https://cdn.com/leo.png',
        precision: 3,
        stakingEnabled: true,
        delegationEnabled: true,
        balance: '1500.750',
        stake: '5000.250',
        delegationsIn: '1000.500',
        delegationsOut: '250.125',
        usdValue: 8765.43,
      })

      expect(token).toMatchSnapshot()
      expect(token.balanced()).toMatchSnapshot()
      expect(token.staked()).toMatchSnapshot()
      expect(token.delegations()).toMatchSnapshot()
    })

    it('should match snapshot for minimal token', () => {
      const token = new HiveEngineToken({
        symbol: 'MIN',
        name: 'Minimal',
        icon: '',
        precision: 0,
        stakingEnabled: false,
        delegationEnabled: false,
        balance: '0',
        stake: '0',
        delegationsIn: '0',
        delegationsOut: '0',
        usdValue: 0,
      })

      expect(token).toMatchSnapshot()
    })
  })
})
