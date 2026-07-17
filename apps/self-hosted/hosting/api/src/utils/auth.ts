/**
 * Shared Auth Utilities
 *
 * Provides secure JWT token creation and verification using jsonwebtoken library.
 * This module is the single source of truth for token handling.
 */

import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { PublicKey, Signature } from '@ecency/sdk/hive';

export interface AuthUser {
  username: string;
}

/**
 * True when `signature` over sha256(challenge) verifies against ANY of the account's
 * posting keys. Accounts routinely carry several posting key_auths (app keys, rotated
 * keys); checking only the first rejects valid logins from holders of the others.
 * Malformed entries are skipped; a malformed signature or empty key list fails.
 */
export function verifyChallengeSignature(
  keyAuths: Array<[string, number]> | undefined,
  challenge: string,
  signature: string
): boolean {
  let sig: Signature;
  try {
    sig = Signature.from(signature);
  } catch {
    return false;
  }

  const messageHash = createHash('sha256').update(challenge).digest();

  return (keyAuths ?? []).some(([key]) => {
    try {
      return PublicKey.fromString(key).verify(messageHash, sig);
    } catch {
      return false;
    }
  });
}

interface TokenPayload {
  username: string;
  iat: number;
  exp: number;
}

// Validate JWT_SECRET on module load
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[Auth] FATAL: JWT_SECRET environment variable is not set');
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (secret.length < 32) {
    console.error('[Auth] FATAL: JWT_SECRET must be at least 32 characters');
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  return secret;
}

/**
 * Create a signed JWT token for a user
 */
export function createToken(username: string, expiresInMs: number = 24 * 60 * 60 * 1000): string {
  const secret = getJwtSecret();
  const expiresInSeconds = Math.floor(expiresInMs / 1000);

  return jwt.sign({ username }, secret, {
    algorithm: 'HS256',
    expiresIn: expiresInSeconds,
  });
}

/**
 * Verify and decode a JWT token
 * Returns the auth user if valid, null otherwise
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as TokenPayload;

    if (!decoded.username) {
      return null;
    }

    return { username: decoded.username };
  } catch (error) {
    // Token is invalid, expired, or malformed
    return null;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiry(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload | null;
    if (decoded?.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
}
