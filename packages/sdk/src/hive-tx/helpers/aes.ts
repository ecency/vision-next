import { ByteBuffer } from './ByteBuffer'
import { cbc as AESCBC } from '@noble/ciphers/aes.js'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { sha256, sha512 } from '@noble/hashes/sha2.js'
import { PrivateKey } from './PrivateKey'
import { PublicKey } from './PublicKey'

export const encrypt = (
  privateKey: PrivateKey,
  publicKey: PublicKey,
  message: Uint8Array,
  nonce: bigint = uniqueNonce()
) => crypt(privateKey, publicKey, nonce, message)

export const decrypt = (
  privateKey: PrivateKey,
  publicKey: PublicKey,
  nonce: bigint,
  message: Uint8Array,
  checksum: number
): Uint8Array => {
  const d = crypt(privateKey, publicKey, nonce, message, checksum)
  return d.message
}

/**
 * @arg message - Encrypted or plain text message (see checksum)
 * @arg checksum - shared secret checksum (null to encrypt, non-null to decrypt)
 */
const crypt = (
  privateKey: PrivateKey,
  publicKey: PublicKey,
  nonce: bigint,
  message: Uint8Array,
  checksum?: number
): { nonce: bigint; message: Uint8Array; checksum: number } => {
  const nonceL = nonce
  const S = privateKey.getSharedSecret(publicKey)
  let ebuf = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
  ebuf.writeUint64(nonceL)
  ebuf.append(S)
  ebuf.flip()

  const encryptionKey = sha512(new Uint8Array(ebuf.toBuffer()))
  const iv = encryptionKey.subarray(32, 48)
  const tag = encryptionKey.subarray(0, 32)

  // check if first 64 bit of sha256 hash treated as uint64_t truncated to 32 bits.
  const check = sha256(encryptionKey).subarray(0, 4)
  const cbuf = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
  cbuf.append(check)
  cbuf.flip()
  const check32 = cbuf.readUint32()
  if (checksum !== undefined) {
    if (check32 !== checksum) {
      throw new Error('Invalid key')
    }
    message = cryptoJsDecrypt(message, tag, iv)
  } else {
    message = cryptoJsEncrypt(message, tag, iv)
  }
  return { nonce: nonceL, message, checksum: check32 }
}

/**
 * This method does not use a checksum, the returned data must be validated some other way.
 * @arg {string|Uint8Array} ciphertext - binary format
 * @return {Uint8Array} the decrypted message
 */
const cryptoJsDecrypt = (message: Uint8Array, tag: Uint8Array, iv: Uint8Array): Uint8Array => {
  let messageBuffer = message
  const decipher = AESCBC(tag, iv)
  messageBuffer = decipher.decrypt(messageBuffer)
  return messageBuffer
}

/**
 * This method does not use a checksum, the returned data must be validated some other way.
 * @arg {string|Uint8Array} plaintext - binary format
 * @return {Uint8Array} binary
 */
export const cryptoJsEncrypt = (
  message: Uint8Array,
  tag: Uint8Array,
  iv: Uint8Array
): Uint8Array => {
  let messageBuffer = message
  const cipher = AESCBC(tag, iv)
  messageBuffer = cipher.encrypt(messageBuffer)
  return messageBuffer
}

let uniqueNonceEntropy: number | null = null

const uniqueNonce = (): bigint => {
  if (uniqueNonceEntropy === null) {
    const randomPrivateKey = secp256k1.utils.randomSecretKey()
    uniqueNonceEntropy = (randomPrivateKey[0] << 8) | randomPrivateKey[1]
  }
  let long = BigInt(Date.now())
  const entropy = ++uniqueNonceEntropy % 0x10000
  long = (long << BigInt(16)) | BigInt(entropy)
  return long
}
