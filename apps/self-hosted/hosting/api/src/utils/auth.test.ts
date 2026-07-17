import { createHash } from 'crypto';
import { PrivateKey } from '@ecency/sdk/hive';
import { describe, expect, it } from 'vitest';

process.env.JWT_SECRET = 'test-secret-string-of-32-characters!!';
const { verifyChallengeSignature } = await import('./auth');

const CHALLENGE = 'ecency-hosting-login:tester:1234567890:abcdefghijklmnop';

const keyA = PrivateKey.fromSeed('hosting-test-key-a');
const keyB = PrivateKey.fromSeed('hosting-test-key-b');

const sign = (key: typeof keyA, message: string) =>
  key.sign(createHash('sha256').update(message).digest()).customToString();

describe('verifyChallengeSignature', () => {
  it('accepts a signature from a NON-first posting key', () => {
    // The regression: accounts with several posting key_auths (e.g. app keys) were
    // rejected because only key_auths[0][0] was checked.
    const keyAuths: Array<[string, number]> = [
      [keyA.createPublic().toString(), 1],
      [keyB.createPublic().toString(), 1],
    ];
    expect(verifyChallengeSignature(keyAuths, CHALLENGE, sign(keyB, CHALLENGE))).toBe(true);
    expect(verifyChallengeSignature(keyAuths, CHALLENGE, sign(keyA, CHALLENGE))).toBe(true);
  });

  it('rejects a signature from a key that is not on the account', () => {
    const keyAuths: Array<[string, number]> = [[keyA.createPublic().toString(), 1]];
    expect(verifyChallengeSignature(keyAuths, CHALLENGE, sign(keyB, CHALLENGE))).toBe(false);
  });

  it('rejects a valid signature over a DIFFERENT challenge', () => {
    const keyAuths: Array<[string, number]> = [[keyA.createPublic().toString(), 1]];
    expect(verifyChallengeSignature(keyAuths, CHALLENGE, sign(keyA, 'other-message'))).toBe(
      false
    );
  });

  it('skips malformed key entries and still verifies against a later valid key', () => {
    const keyAuths: Array<[string, number]> = [
      ['not-a-key', 1],
      [keyA.createPublic().toString(), 1],
    ];
    expect(verifyChallengeSignature(keyAuths, CHALLENGE, sign(keyA, CHALLENGE))).toBe(true);
  });

  it('fails closed on malformed signatures and missing key lists', () => {
    const keyAuths: Array<[string, number]> = [[keyA.createPublic().toString(), 1]];
    expect(verifyChallengeSignature(keyAuths, CHALLENGE, 'zz-not-a-signature')).toBe(false);
    expect(verifyChallengeSignature(undefined, CHALLENGE, sign(keyA, CHALLENGE))).toBe(false);
    expect(verifyChallengeSignature([], CHALLENGE, sign(keyA, CHALLENGE))).toBe(false);
  });
});
