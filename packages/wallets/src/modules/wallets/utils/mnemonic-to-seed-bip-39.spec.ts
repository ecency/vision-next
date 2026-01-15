import { describe, it, expect } from 'vitest'
import { mnemonicToSeedBip39 } from './mnemonic-to-seed-bip-39'

describe('mnemonicToSeedBip39', () => {
  describe('valid mnemonics', () => {
    it('should convert 12-word mnemonic to hex seed', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      const result = mnemonicToSeedBip39(mnemonic)

      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(result).toMatch(/^[0-9a-f]+$/) // Should be hex string
      expect(result).toMatchSnapshot()
    })

    it('should convert 24-word mnemonic to hex seed', () => {
      const mnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'
      const result = mnemonicToSeedBip39(mnemonic)

      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
      expect(result).toMatch(/^[0-9a-f]+$/)
      expect(result).toMatchSnapshot()
    })

    it('should produce consistent results for same mnemonic', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

      const result1 = mnemonicToSeedBip39(mnemonic)
      const result2 = mnemonicToSeedBip39(mnemonic)

      expect(result1).toBe(result2)
    })

    it('should produce different seeds for different mnemonics', () => {
      const mnemonic1 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      const mnemonic2 = 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong'

      const result1 = mnemonicToSeedBip39(mnemonic1)
      const result2 = mnemonicToSeedBip39(mnemonic2)

      expect(result1).not.toBe(result2)
    })
  })

  describe('seed format', () => {
    it('should return a valid hex string', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      const result = mnemonicToSeedBip39(mnemonic)

      // Hex string should only contain 0-9 and a-f
      expect(/^[0-9a-f]+$/.test(result)).toBe(true)
    })

    it('should return seed with expected length (128 hex chars = 64 bytes)', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      const result = mnemonicToSeedBip39(mnemonic)

      // BIP39 seeds are 64 bytes (512 bits), which is 128 hex characters
      expect(result.length).toBe(128)
    })

    it('should handle different mnemonic lengths consistently', () => {
      const mnemonic12 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      const mnemonic24 =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'

      const result12 = mnemonicToSeedBip39(mnemonic12)
      const result24 = mnemonicToSeedBip39(mnemonic24)

      // Both should produce 64-byte (128 hex char) seeds
      expect(result12.length).toBe(128)
      expect(result24.length).toBe(128)
    })
  })

  describe('various mnemonics', () => {
    it.each([
      ['abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'],
      ['legal winner thank year wave sausage worth useful legal winner thank yellow'],
      ['letter advice cage absurd amount doctor acoustic avoid letter advice cage above'],
    ])('should convert mnemonic %s to seed', (mnemonic) => {
      const result = mnemonicToSeedBip39(mnemonic)

      expect(result).toBeTruthy()
      expect(result.length).toBe(128)
      expect(result).toMatch(/^[0-9a-f]+$/)
    })
  })

  describe('edge cases', () => {
    it('should handle mnemonic with extra whitespace', () => {
      const mnemonic = '  abandon   abandon  abandon abandon abandon abandon abandon abandon abandon abandon abandon about  '
      const cleanMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

      const result1 = mnemonicToSeedBip39(mnemonic)
      const result2 = mnemonicToSeedBip39(cleanMnemonic)

      // Results might differ due to whitespace handling, but both should be valid
      expect(result1).toBeTruthy()
      expect(result2).toBeTruthy()
      expect(result1.length).toBe(128)
      expect(result2.length).toBe(128)
    })

    it('should handle 15-word mnemonic', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

      const result = mnemonicToSeedBip39(mnemonic)
      expect(result).toBeTruthy()
      expect(result.length).toBe(128)
    })

    it('should handle 18-word mnemonic', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

      const result = mnemonicToSeedBip39(mnemonic)
      expect(result).toBeTruthy()
      expect(result.length).toBe(128)
    })

    it('should handle 21-word mnemonic', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

      const result = mnemonicToSeedBip39(mnemonic)
      expect(result).toBeTruthy()
      expect(result.length).toBe(128)
    })
  })

  describe('deterministic generation', () => {
    it('should generate same seed on multiple calls', () => {
      const mnemonic = 'legal winner thank year wave sausage worth useful legal winner thank yellow'

      const results = Array.from({ length: 5 }, () => mnemonicToSeedBip39(mnemonic))

      const firstResult = results[0]
      results.forEach((result) => {
        expect(result).toBe(firstResult)
      })
    })
  })

  describe('complete snapshots', () => {
    it('should match snapshot for standard 12-word mnemonic', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
      const result = mnemonicToSeedBip39(mnemonic)
      expect(result).toMatchSnapshot()
    })

    it('should match snapshot for standard 24-word mnemonic', () => {
      const mnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'
      const result = mnemonicToSeedBip39(mnemonic)
      expect(result).toMatchSnapshot()
    })

    it('should match snapshot for different mnemonic phrases', () => {
      const mnemonics = {
        standard: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
        winner: 'legal winner thank year wave sausage worth useful legal winner thank yellow',
        letter: 'letter advice cage absurd amount doctor acoustic avoid letter advice cage above',
      }

      const results = Object.fromEntries(
        Object.entries(mnemonics).map(([key, mnemonic]) => [
          key,
          mnemonicToSeedBip39(mnemonic),
        ])
      )

      expect(results).toMatchSnapshot()
    })
  })
})
