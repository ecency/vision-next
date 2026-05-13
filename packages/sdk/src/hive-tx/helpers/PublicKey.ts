import { ripemd160 } from '@noble/hashes/legacy.js'
import bs58 from 'bs58'
import { config } from '../config'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { Signature } from './Signature'

export class PublicKey {
  key: Uint8Array
  prefix: string

  /**
   * Creates a new PublicKey instance from raw bytes.
   * @param key Raw public key bytes (33 bytes, compressed format)
   * @param prefix Optional address prefix (defaults to the current config.address_prefix)
   */
  constructor(key: Uint8Array, prefix?: string) {
    this.key = key
    // Read config at call time so runtime mutations to config.address_prefix
    // (e.g. switching to a non-mainnet network) take effect for new instances.
    this.prefix = prefix ?? config.address_prefix
  }

  /**
   * Creates a PublicKey from a string representation.
   * The expected prefix is read from config.address_prefix at call time, so
   * consumers can switch networks at runtime.
   * @param wif Public key string (e.g., "STM8m5UgaFAAYQRuaNejYdS8FVLVp9Ss3K1qAVk5de6F8s3HnVbvA")
   * @returns New PublicKey instance
   * @throws Error if the prefix, length, checksum, or curve point is invalid
   */
  static fromString(wif: string): PublicKey {
    const expectedPrefix = config.address_prefix
    if (typeof wif !== 'string' || wif.length <= expectedPrefix.length) {
      throw new Error('Invalid public key')
    }
    const prefix = wif.slice(0, expectedPrefix.length)
    if (prefix !== expectedPrefix) {
      throw new Error(`Public key must start with ${expectedPrefix}`)
    }
    let buffer: Uint8Array
    try {
      buffer = bs58.decode(wif.slice(expectedPrefix.length))
    } catch {
      throw new Error('Invalid public key encoding')
    }
    // 33-byte compressed secp256k1 point + 4-byte RIPEMD160 checksum
    if (buffer.length !== 37) {
      throw new Error('Invalid public key length')
    }
    const key = buffer.subarray(0, 33)
    const checksum = buffer.subarray(33, 37)
    const expectedChecksum = ripemd160(key).subarray(0, 4)
    if (!isUint8ArrayEqual(checksum, expectedChecksum)) {
      throw new Error('Public key checksum mismatch')
    }
    try {
      secp256k1.Point.fromBytes(key)
    } catch {
      throw new Error('Invalid public key')
    }
    return new PublicKey(key, prefix)
  }

  /**
   * Creates a PublicKey from a string or returns the instance if already a PublicKey.
   * @param value Public key string or PublicKey instance
   * @returns New or existing PublicKey instance
   */
  static from(value: string | PublicKey): PublicKey {
    if (value instanceof PublicKey) {
      return value
    } else {
      return PublicKey.fromString(value as string)
    }
  }

  /**
   * Verifies a signature against a message hash.
   * @param message 32-byte message hash to verify
   * @param signature Signature to verify
   * @returns True if signature is valid, false otherwise
   */
  verify(message: Uint8Array, signature: Signature | string): boolean {
    if (typeof signature === 'string') {
      signature = Signature.from(signature)
    }
    return secp256k1.verify(signature.data, message, this.key, {
      prehash: false,
      format: 'compact'
    })
  }

  /**
   * Returns the public key as a string for storage or transmission.
   * @returns Public key string with prefix (e.g., "STM8m5UgaFAAYQRuaNejYdS8FVLVp9Ss3K1qAVk5de6F8s3HnVbvA")
   */
  toString(): string {
    return encodePublic(this.key, this.prefix)
  }

  /**
   * Returns JSON representation (same as toString()).
   * @returns Public key string
   */
  toJSON(): string {
    return this.toString()
  }

  /**
   * Returns a string representation for debugging.
   * @returns Formatted public key string
   */
  inspect(): string {
    return `PublicKey: ${this.toString()}`
  }
}

const encodePublic = (key: Uint8Array, prefix: string): string => {
  const checksum = ripemd160(key)
  return prefix + bs58.encode(new Uint8Array([...key, ...checksum.subarray(0, 4)]))
}

const isUint8ArrayEqual = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.byteLength !== b.byteLength) return false
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}
