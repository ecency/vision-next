import { createHash } from 'crypto';
import { PrivateKey } from '@ecency/sdk/hive';
import { describe, expect, it } from 'vitest';

process.env.JWT_SECRET = 'test-secret-string-of-32-characters!!';
const { verifyChallengeSignature } = await import('./auth');
type PostingAuthority = import('./auth').PostingAuthority;

const CHALLENGE = 'ecency-hosting-login:tester:1234567890:abcdefghijklmnop';

const keyA = PrivateKey.fromSeed('hosting-test-key-a');
const keyB = PrivateKey.fromSeed('hosting-test-key-b');

const sign = (key: typeof keyA, message: string) =>
  key.sign(createHash('sha256').update(message).digest()).customToString();

const authority = (
  keyAuths: Array<[string, number]>,
  weightThreshold = 1
): PostingAuthority => ({ weight_threshold: weightThreshold, key_auths: keyAuths });

describe('verifyChallengeSignature', () => {
  it('accepts a signature from a NON-first posting key', () => {
    // The regression: accounts with several posting key_auths (e.g. app keys) were
    // rejected because only key_auths[0][0] was checked.
    const posting = authority([
      [keyA.createPublic().toString(), 1],
      [keyB.createPublic().toString(), 1],
    ]);
    expect(verifyChallengeSignature(posting, CHALLENGE, sign(keyB, CHALLENGE))).toBe(true);
    expect(verifyChallengeSignature(posting, CHALLENGE, sign(keyA, CHALLENGE))).toBe(true);
  });

  it('rejects a signature from a key that is not on the account', () => {
    const posting = authority([[keyA.createPublic().toString(), 1]]);
    expect(verifyChallengeSignature(posting, CHALLENGE, sign(keyB, CHALLENGE))).toBe(false);
  });

  it('rejects a valid signature over a DIFFERENT challenge', () => {
    const posting = authority([[keyA.createPublic().toString(), 1]]);
    expect(verifyChallengeSignature(posting, CHALLENGE, sign(keyA, 'other-message'))).toBe(
      false
    );
  });

  it('rejects a key whose weight cannot meet the posting threshold alone', () => {
    // A single login signature proves one key; on a weighted/multisig authority a
    // partial-authority key must not obtain a session.
    const posting = authority(
      [
        [keyA.createPublic().toString(), 1],
        [keyB.createPublic().toString(), 2],
      ],
      2
    );
    expect(verifyChallengeSignature(posting, CHALLENGE, sign(keyA, CHALLENGE))).toBe(false);
    expect(verifyChallengeSignature(posting, CHALLENGE, sign(keyB, CHALLENGE))).toBe(true);
  });

  it('skips malformed key entries and still verifies against a later valid key', () => {
    const posting = authority([
      ['not-a-key', 1],
      [keyA.createPublic().toString(), 1],
    ]);
    expect(verifyChallengeSignature(posting, CHALLENGE, sign(keyA, CHALLENGE))).toBe(true);
  });

  it('fails closed on malformed signatures and missing authorities', () => {
    const posting = authority([[keyA.createPublic().toString(), 1]]);
    expect(verifyChallengeSignature(posting, CHALLENGE, 'zz-not-a-signature')).toBe(false);
    expect(verifyChallengeSignature(undefined, CHALLENGE, sign(keyA, CHALLENGE))).toBe(false);
    expect(verifyChallengeSignature(authority([]), CHALLENGE, sign(keyA, CHALLENGE))).toBe(
      false
    );
  });
});
