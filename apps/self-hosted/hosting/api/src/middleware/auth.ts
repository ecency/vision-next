/**
 * Auth Middleware
 *
 * Validates Bearer tokens for protected routes
 */

import type { Context, Next } from 'hono';
import { cryptoUtils } from '@hiveio/dhive';

interface AuthUser {
  username: string;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: AuthUser;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization required' }, 401);
  }

  const token = authHeader.slice(7);
  const user = verifyToken(token);

  if (!user) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }

  c.set('user', user);
  await next();
}

function verifyToken(token: string): AuthUser | null {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;

    const secret = process.env.JWT_SECRET || 'dev-secret';
    const expectedSig = cryptoUtils.sha256(payload + secret).toString('hex').slice(0, 32);

    if (sig !== expectedSig) return null;

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());

    // Check expiration
    if (data.exp < Date.now()) return null;

    return { username: data.username };
  } catch {
    return null;
  }
}
