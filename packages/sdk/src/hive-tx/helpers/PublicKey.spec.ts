import { describe, expect, it } from 'vitest'
import { PublicKey } from './PublicKey'
import { PrivateKey } from './PrivateKey'

describe('PublicKey.fromString', () => {
  it('accepts a valid STM-prefixed public key', () => {
    const pub = PrivateKey.randomKey().createPublic().toString()
    expect(pub.startsWith('STM')).toBe(true)
    expect(() => PublicKey.fromString(pub)).not.toThrow()
    expect(PublicKey.fromString(pub).toString()).toBe(pub)
  })

  it('rejects a Hive master password (P-prefixed WIF derivative)', () => {
    // Master passwords are generated as "P" + WIF — they happen to be valid
    // base58 in the suffix, which used to make fromString silently succeed.
    const masterPassword = 'P' + PrivateKey.randomKey().toString()
    expect(() => PublicKey.fromString(masterPassword)).toThrow()
  })

  it('rejects a raw WIF private key', () => {
    const wif = PrivateKey.randomKey().toString()
    expect(() => PublicKey.fromString(wif)).toThrow()
  })

  it('rejects a wrong-prefix public key', () => {
    const pub = PrivateKey.randomKey().createPublic().toString()
    const swapped = 'TST' + pub.slice(3)
    expect(() => PublicKey.fromString(swapped)).toThrow(/must start with STM/)
  })

  it('rejects a corrupted-checksum public key', () => {
    const pub = PrivateKey.randomKey().createPublic().toString()
    // Flip the last character to corrupt the checksum
    const last = pub[pub.length - 1]
    const replacement = last === '1' ? '2' : '1'
    const corrupted = pub.slice(0, -1) + replacement
    expect(() => PublicKey.fromString(corrupted)).toThrow()
  })

  it('rejects empty and too-short input', () => {
    expect(() => PublicKey.fromString('')).toThrow()
    expect(() => PublicKey.fromString('STM')).toThrow()
  })

  it('rejects arbitrary garbage', () => {
    expect(() => PublicKey.fromString('hello world')).toThrow()
  })
})
