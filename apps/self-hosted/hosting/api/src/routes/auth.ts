/**
 * Auth Routes
 *
 * Handles Hive-based authentication for the hosting API
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Client, cryptoUtils, Signature, PublicKey } from '@hiveio/dhive';
import { TenantService } from '../services/tenant-service';
import { nanoid } from 'nanoid';
import { createToken, verifyToken, getTokenExpiry } from '../utils/auth';
import { challengeStore } from '../utils/redis';

export const authRoutes = new Hono();

const hiveClient = new Client(
  process.env.HIVE_API_URL?.split(',') || ['https://api.hive.blog']
);

// Validation schemas
const loginChallengeSchema = z.object({
  username: z.string().min(3).max(16),
});

const loginVerifySchema = z.object({
  username: z.string().min(3).max(16),
  signature: z.string(),
  challenge: z.string(),
});

// POST /v1/auth/challenge - Get login challenge
authRoutes.post(
  '/challenge',
  zValidator('json', loginChallengeSchema),
  async (c) => {
    const { username } = c.req.valid('json');

    // Verify Hive account exists
    const accounts = await hiveClient.database.getAccounts([username]);
    if (accounts.length === 0) {
      return c.json({ error: 'Hive account not found' }, 404);
    }

    // Generate challenge
    const challenge = `ecency-hosting-login:${username}:${Date.now()}:${nanoid(16)}`;
    const ttlSeconds = 5 * 60; // 5 minutes
    const expiresAt = Date.now() + ttlSeconds * 1000;

    // Store challenge in Redis
    await challengeStore.set(username, challenge, ttlSeconds);

    return c.json({
      username,
      challenge,
      expiresAt: new Date(expiresAt).toISOString(),
      instructions:
        'Sign this challenge with your Hive posting key using Keychain or HiveSigner',
    });
  }
);

// POST /v1/auth/verify - Verify signed challenge and issue token
authRoutes.post(
  '/verify',
  zValidator('json', loginVerifySchema),
  async (c) => {
    const { username, signature, challenge } = c.req.valid('json');

    // Check challenge exists and not expired (from Redis)
    const storedChallenge = await challengeStore.get(username);
    if (!storedChallenge || storedChallenge.challenge !== challenge) {
      return c.json({ error: 'Invalid or expired challenge' }, 400);
    }

    if (storedChallenge.expiresAt < Date.now()) {
      await challengeStore.delete(username);
      return c.json({ error: 'Challenge expired' }, 400);
    }

    // Get account public keys
    const accounts = await hiveClient.database.getAccounts([username]);
    if (accounts.length === 0) {
      return c.json({ error: 'Account not found' }, 404);
    }

    const account = accounts[0];

    // Verify signature against posting key
    try {
      const publicKey = PublicKey.fromString(account.posting.key_auths[0][0]);
      const sig = Signature.fromString(signature);
      const messageHash = cryptoUtils.sha256(challenge);

      const recovered = sig.recover(messageHash);
      if (!recovered.equals(publicKey)) {
        return c.json({ error: 'Invalid signature' }, 401);
      }
    } catch (err) {
      console.error('Signature verification error:', err);
      return c.json({ error: 'Invalid signature format' }, 400);
    }

    // Clean up challenge from Redis
    await challengeStore.delete(username);

    // Generate proper JWT token using shared utility
    const expiresInMs = 24 * 60 * 60 * 1000; // 24 hours
    const token = createToken(username, expiresInMs);
    const expiresAt = getTokenExpiry(token);

    return c.json({
      token,
      username,
      expiresAt: expiresAt?.toISOString(),
    });
  }
);

// GET /v1/auth/me - Get current user info
authRoutes.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  const token = authHeader.slice(7);
  const user = verifyToken(token);

  if (!user) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  // Get tenant info
  const tenant = await TenantService.getByUsername(user.username);

  return c.json({
    username: user.username,
    hasTenant: !!tenant,
    tenant: tenant
      ? {
          subscriptionStatus: tenant.subscriptionStatus,
          subscriptionPlan: tenant.subscriptionPlan,
          subscriptionExpiresAt: tenant.subscriptionExpiresAt,
          blogUrl: TenantService.getBlogUrl(tenant),
        }
      : null,
  });
});

// GET /v1/auth/tenant-lookup - Traefik middleware for custom domain routing
authRoutes.get('/tenant-lookup', async (c) => {
  const host = c.req.header('X-Forwarded-Host') || c.req.header('Host');

  if (!host) {
    return c.json({ error: 'No host header' }, 400);
  }

  // Check if it's a subdomain of our base domain
  const baseDomain = process.env.BASE_DOMAIN || 'blogs.ecency.com';
  if (host.endsWith('.' + baseDomain)) {
    const subdomain = host.replace('.' + baseDomain, '');
    c.header('X-Tenant-Id', subdomain);
    return c.json({ tenantId: subdomain });
  }

  // Check custom domain
  const tenant = await TenantService.getByDomain(host);
  if (tenant) {
    c.header('X-Tenant-Id', tenant.username);
    return c.json({ tenantId: tenant.username });
  }

  return c.json({ error: 'Unknown domain' }, 404);
});

export default authRoutes;
