import { describe, it, expect, vi } from 'vitest'
import { getWallet } from './get-wallet'
import { EcencyWalletCurrency } from '@/modules/wallets/enums'

// Mock the okxweb3 wallet modules
vi.mock('@okxweb3/coin-bitcoin', () => ({
  BtcWallet: vi.fn().mockImplementation(() => ({ type: 'BTC' })),
}))

vi.mock('@okxweb3/coin-ethereum', () => ({
  EthWallet: vi.fn().mockImplementation(() => ({ type: 'ETH' })),
}))

vi.mock('@okxweb3/coin-tron', () => ({
  TrxWallet: vi.fn().mockImplementation(() => ({ type: 'TRON' })),
}))

vi.mock('@okxweb3/coin-ton', () => ({
  TonWallet: vi.fn().mockImplementation(() => ({ type: 'TON' })),
}))

vi.mock('@okxweb3/coin-solana', () => ({
  SolWallet: vi.fn().mockImplementation(() => ({ type: 'SOL' })),
}))

vi.mock('@okxweb3/coin-aptos', () => ({
  AptosWallet: vi.fn().mockImplementation(() => ({ type: 'APT' })),
}))

describe('getWallet', () => {
  describe('Bitcoin wallet', () => {
    it('should return BtcWallet for BTC currency', () => {
      const wallet = getWallet(EcencyWalletCurrency.BTC)
      expect(wallet).toBeDefined()
      expect(wallet).toMatchObject({ type: 'BTC' })
      expect(wallet).toMatchSnapshot()
    })
  })

  describe('Ethereum-based wallets', () => {
    it('should return EthWallet for ETH currency', () => {
      const wallet = getWallet(EcencyWalletCurrency.ETH)
      expect(wallet).toBeDefined()
      expect(wallet).toMatchObject({ type: 'ETH' })
      expect(wallet).toMatchSnapshot()
    })

    it('should return EthWallet for BNB currency', () => {
      const wallet = getWallet(EcencyWalletCurrency.BNB)
      expect(wallet).toBeDefined()
      expect(wallet).toMatchObject({ type: 'ETH' })
    })

    it('should use same wallet implementation for ETH and BNB', () => {
      const ethWallet = getWallet(EcencyWalletCurrency.ETH)
      const bnbWallet = getWallet(EcencyWalletCurrency.BNB)

      expect(ethWallet?.constructor.name).toBe(bnbWallet?.constructor.name)
    })
  })

  describe('Tron wallet', () => {
    it('should return TrxWallet for TRON currency', () => {
      const wallet = getWallet(EcencyWalletCurrency.TRON)
      expect(wallet).toBeDefined()
      expect(wallet).toMatchObject({ type: 'TRON' })
      expect(wallet).toMatchSnapshot()
    })
  })

  describe('TON wallet', () => {
    it('should return TonWallet for TON currency', () => {
      const wallet = getWallet(EcencyWalletCurrency.TON)
      expect(wallet).toBeDefined()
      expect(wallet).toMatchObject({ type: 'TON' })
      expect(wallet).toMatchSnapshot()
    })
  })

  describe('Solana wallet', () => {
    it('should return SolWallet for SOL currency', () => {
      const wallet = getWallet(EcencyWalletCurrency.SOL)
      expect(wallet).toBeDefined()
      expect(wallet).toMatchObject({ type: 'SOL' })
      expect(wallet).toMatchSnapshot()
    })
  })

  describe('Aptos wallet', () => {
    it('should return AptosWallet for APT currency', () => {
      const wallet = getWallet(EcencyWalletCurrency.APT)
      expect(wallet).toBeDefined()
      expect(wallet).toMatchObject({ type: 'APT' })
      expect(wallet).toMatchSnapshot()
    })
  })

  describe('all supported currencies', () => {
    it.each([
      [EcencyWalletCurrency.BTC, 'BTC'],
      [EcencyWalletCurrency.ETH, 'ETH'],
      [EcencyWalletCurrency.BNB, 'ETH'], // BNB uses ETH wallet
      [EcencyWalletCurrency.TRON, 'TRON'],
      [EcencyWalletCurrency.TON, 'TON'],
      [EcencyWalletCurrency.SOL, 'SOL'],
      [EcencyWalletCurrency.APT, 'APT'],
    ])('should return correct wallet type for %s', (currency, expectedType) => {
      const wallet = getWallet(currency)
      expect(wallet).toBeDefined()
      expect(wallet).toMatchObject({ type: expectedType })
    })
  })

  describe('unsupported currencies', () => {
    it('should return undefined for unknown currency', () => {
      const wallet = getWallet('UNKNOWN' as EcencyWalletCurrency)
      expect(wallet).toBeUndefined()
    })

    it('should return undefined for invalid currency value', () => {
      const wallet = getWallet('' as EcencyWalletCurrency)
      expect(wallet).toBeUndefined()
    })

    it('should return undefined for null-like values', () => {
      const wallet = getWallet(null as any)
      expect(wallet).toBeUndefined()
    })
  })

  describe('wallet instance uniqueness', () => {
    it('should create new instance on each call for BTC', () => {
      const wallet1 = getWallet(EcencyWalletCurrency.BTC)
      const wallet2 = getWallet(EcencyWalletCurrency.BTC)

      expect(wallet1).toBeDefined()
      expect(wallet2).toBeDefined()
      // New instances are created each time
      expect(wallet1).not.toBe(wallet2)
    })

    it('should create new instance on each call for ETH', () => {
      const wallet1 = getWallet(EcencyWalletCurrency.ETH)
      const wallet2 = getWallet(EcencyWalletCurrency.ETH)

      expect(wallet1).toBeDefined()
      expect(wallet2).toBeDefined()
      expect(wallet1).not.toBe(wallet2)
    })

    it('should create independent instances for different currencies', () => {
      const btcWallet = getWallet(EcencyWalletCurrency.BTC)
      const ethWallet = getWallet(EcencyWalletCurrency.ETH)
      const solWallet = getWallet(EcencyWalletCurrency.SOL)

      expect(btcWallet).toBeDefined()
      expect(ethWallet).toBeDefined()
      expect(solWallet).toBeDefined()

      expect(btcWallet).not.toBe(ethWallet)
      expect(ethWallet).not.toBe(solWallet)
      expect(btcWallet).not.toBe(solWallet)
    })
  })

  describe('complete snapshots', () => {
    it('should match snapshot for all supported wallet types', () => {
      const wallets = {
        btc: getWallet(EcencyWalletCurrency.BTC),
        eth: getWallet(EcencyWalletCurrency.ETH),
        bnb: getWallet(EcencyWalletCurrency.BNB),
        tron: getWallet(EcencyWalletCurrency.TRON),
        ton: getWallet(EcencyWalletCurrency.TON),
        sol: getWallet(EcencyWalletCurrency.SOL),
        apt: getWallet(EcencyWalletCurrency.APT),
      }

      expect(wallets).toMatchSnapshot()
    })

    it('should match snapshot for undefined result', () => {
      const wallet = getWallet('INVALID' as EcencyWalletCurrency)
      expect(wallet).toMatchSnapshot()
    })
  })
})
