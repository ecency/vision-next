import { describe, it, expect, vi, beforeEach } from 'vitest'
import { encryptMemoWithKeys, encryptMemoWithAccounts } from './encrypt-memo'
import { decryptMemoWithKeys, decryptMemoWithAccounts } from './decrypt-memo'
import type { Client } from '@hiveio/dhive'

// Mock the @hiveio/dhive modules
vi.mock('@hiveio/dhive', () => ({
  PrivateKey: {
    fromString: vi.fn((key: string) => ({ key })),
  },
}))

vi.mock('@hiveio/dhive/lib/memo', () => ({
  Memo: {
    encode: vi.fn((privateKey, publicKey, memo) => `encrypted:${memo}`),
    decode: vi.fn((privateKey, memo) => {
      if (memo.startsWith('encrypted:')) {
        return memo.replace('encrypted:', '')
      }
      return memo
    }),
  },
}))

describe('encryptMemoWithKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should encrypt memo with given keys', () => {
    const privateKey = '5JTestPrivateKey'
    const publicKey = 'STM6TestPublicKey'
    const memo = 'Hello, this is a secret message'

    const result = encryptMemoWithKeys(privateKey, publicKey, memo)
    expect(result).toBe('encrypted:Hello, this is a secret message')
    expect(result).toMatchSnapshot()
  })

  it('should handle empty memo', () => {
    const privateKey = '5JTestPrivateKey'
    const publicKey = 'STM6TestPublicKey'
    const memo = ''

    const result = encryptMemoWithKeys(privateKey, publicKey, memo)
    expect(result).toBe('encrypted:')
  })

  it('should handle long memos', () => {
    const privateKey = '5JTestPrivateKey'
    const publicKey = 'STM6TestPublicKey'
    const memo = 'A'.repeat(500)

    const result = encryptMemoWithKeys(privateKey, publicKey, memo)
    expect(result).toContain('encrypted:')
  })

  it('should handle special characters in memo', () => {
    const privateKey = '5JTestPrivateKey'
    const publicKey = 'STM6TestPublicKey'
    const memo = 'Special chars: !@#$%^&*()_+-=[]{}|;:\'",.<>?/~`'

    const result = encryptMemoWithKeys(privateKey, publicKey, memo)
    expect(result).toBeTruthy()
  })

  it('should handle unicode characters', () => {
    const privateKey = '5JTestPrivateKey'
    const publicKey = 'STM6TestPublicKey'
    const memo = 'Unicode: 你好世界 🚀 café'

    const result = encryptMemoWithKeys(privateKey, publicKey, memo)
    expect(result).toBeTruthy()
  })

  it.each([
    ['Simple message', 'encrypted:Simple message'],
    ['Message with numbers 123', 'encrypted:Message with numbers 123'],
    ['Multi\nline\nmemo', 'encrypted:Multi\nline\nmemo'],
  ])('should encrypt %s correctly', (memo, expected) => {
    const privateKey = '5JTestPrivateKey'
    const publicKey = 'STM6TestPublicKey'

    const result = encryptMemoWithKeys(privateKey, publicKey, memo)
    expect(result).toBe(expected)
  })
})

describe('encryptMemoWithAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should encrypt memo by fetching recipient public key', async () => {
    const mockClient = {
      database: {
        getAccounts: vi.fn().mockResolvedValue([
          {
            name: 'recipient',
            memo_key: 'STM6RecipientMemoKey',
          },
        ]),
      },
    } as unknown as Client

    const privateKey = '5JSenderPrivateKey'
    const toAccount = 'recipient'
    const memo = 'Secret message for recipient'

    const result = await encryptMemoWithAccounts(mockClient, privateKey, toAccount, memo)
    expect(result).toBe('encrypted:Secret message for recipient')
    expect(mockClient.database.getAccounts).toHaveBeenCalledWith(['recipient'])
    expect(result).toMatchSnapshot()
  })

  it('should throw error when account not found', async () => {
    const mockClient = {
      database: {
        getAccounts: vi.fn().mockResolvedValue([]),
      },
    } as unknown as Client

    const privateKey = '5JSenderPrivateKey'
    const toAccount = 'nonexistent'
    const memo = 'Test message'

    await expect(
      encryptMemoWithAccounts(mockClient, privateKey, toAccount, memo)
    ).rejects.toThrow('Account not found')
  })

  it('should handle multiple calls with different accounts', async () => {
    const mockClient = {
      database: {
        getAccounts: vi
          .fn()
          .mockResolvedValueOnce([{ name: 'alice', memo_key: 'STM6AliceKey' }])
          .mockResolvedValueOnce([{ name: 'bob', memo_key: 'STM6BobKey' }]),
      },
    } as unknown as Client

    const privateKey = '5JSenderPrivateKey'
    const memo = 'Test message'

    const result1 = await encryptMemoWithAccounts(mockClient, privateKey, 'alice', memo)
    const result2 = await encryptMemoWithAccounts(mockClient, privateKey, 'bob', memo)

    expect(result1).toBe('encrypted:Test message')
    expect(result2).toBe('encrypted:Test message')
    expect(mockClient.database.getAccounts).toHaveBeenCalledTimes(2)
  })
})

describe('decryptMemoWithKeys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should decrypt encrypted memo', () => {
    const privateKey = '5JTestPrivateKey'
    const encryptedMemo = 'encrypted:Hello, this is a secret message'

    const result = decryptMemoWithKeys(privateKey, encryptedMemo)
    expect(result).toBe('Hello, this is a secret message')
    expect(result).toMatchSnapshot()
  })

  it('should handle encrypted empty memo', () => {
    const privateKey = '5JTestPrivateKey'
    const encryptedMemo = 'encrypted:'

    const result = decryptMemoWithKeys(privateKey, encryptedMemo)
    expect(result).toBe('')
  })

  it('should handle non-encrypted memo (passthrough)', () => {
    const privateKey = '5JTestPrivateKey'
    const memo = 'Not encrypted'

    const result = decryptMemoWithKeys(privateKey, memo)
    expect(result).toBe('Not encrypted')
  })

  it.each([
    ['encrypted:Simple message', 'Simple message'],
    ['encrypted:Message with numbers 123', 'Message with numbers 123'],
    ['encrypted:Unicode 你好', 'Unicode 你好'],
  ])('should decrypt %s correctly', (encryptedMemo, expected) => {
    const privateKey = '5JTestPrivateKey'

    const result = decryptMemoWithKeys(privateKey, encryptedMemo)
    expect(result).toBe(expected)
  })
})

describe('decryptMemoWithAccounts', () => {
  it('should be an alias of decryptMemoWithKeys', () => {
    expect(decryptMemoWithAccounts).toBe(decryptMemoWithKeys)
  })

  it('should work the same as decryptMemoWithKeys', () => {
    const privateKey = '5JTestPrivateKey'
    const encryptedMemo = 'encrypted:Test message'

    const result1 = decryptMemoWithKeys(privateKey, encryptedMemo)
    const result2 = decryptMemoWithAccounts(privateKey, encryptedMemo)

    expect(result1).toBe(result2)
    expect(result2).toBe('Test message')
  })
})

describe('encrypt and decrypt round-trip', () => {
  it('should successfully encrypt and decrypt a message', () => {
    const privateKey = '5JTestPrivateKey'
    const publicKey = 'STM6TestPublicKey'
    const originalMemo = 'This is a secret message'

    const encrypted = encryptMemoWithKeys(privateKey, publicKey, originalMemo)
    const decrypted = decryptMemoWithKeys(privateKey, encrypted)

    expect(decrypted).toBe(originalMemo)
  })

  it('should handle round-trip with special characters', () => {
    const privateKey = '5JTestPrivateKey'
    const publicKey = 'STM6TestPublicKey'
    const originalMemo = 'Special: !@#$%^&*() 你好 🚀'

    const encrypted = encryptMemoWithKeys(privateKey, publicKey, originalMemo)
    const decrypted = decryptMemoWithKeys(privateKey, encrypted)

    expect(decrypted).toBe(originalMemo)
  })

  it('should handle round-trip with long messages', () => {
    const privateKey = '5JTestPrivateKey'
    const publicKey = 'STM6TestPublicKey'
    const originalMemo = 'A'.repeat(200)

    const encrypted = encryptMemoWithKeys(privateKey, publicKey, originalMemo)
    const decrypted = decryptMemoWithKeys(privateKey, encrypted)

    expect(decrypted).toBe(originalMemo)
  })

  it('should match snapshot for complete round-trip', () => {
    const privateKey = '5JTestPrivateKey'
    const publicKey = 'STM6TestPublicKey'
    const originalMemo = 'Complete round-trip test'

    const encrypted = encryptMemoWithKeys(privateKey, publicKey, originalMemo)
    const decrypted = decryptMemoWithKeys(privateKey, encrypted)

    expect({
      original: originalMemo,
      encrypted,
      decrypted,
    }).toMatchSnapshot()
  })
})
