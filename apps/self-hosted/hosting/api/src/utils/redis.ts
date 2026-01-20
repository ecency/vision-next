/**
 * Redis Client
 *
 * Provides Redis connection for caching, session storage, and challenges
 */

import { createClient, type RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let redisConnectPromise: Promise<RedisClientType> | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  // Return existing open client
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // If a connection is in progress, wait for it
  if (redisConnectPromise) {
    return redisConnectPromise;
  }

  // Create new connection with shared promise to prevent race conditions
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisClient = createClient({
    url: redisUrl,
  });

  redisClient.on('error', (err) => {
    console.error('[Redis] Connection error:', err);
    // Reset promise on error so callers can retry
    redisConnectPromise = null;
  });

  redisClient.on('connect', () => {
    console.log('[Redis] Connected');
  });

  // Store the promise so concurrent callers wait for the same connection
  redisConnectPromise = redisClient.connect().then(() => {
    // Connection successful, clear the promise (client is now open)
    redisConnectPromise = null;
    return redisClient!;
  }).catch((err) => {
    // Connection failed, reset state so callers can retry
    redisConnectPromise = null;
    redisClient = null;
    throw err;
  });

  return redisConnectPromise;
}

/**
 * Challenge storage using Redis
 */
export const challengeStore = {
  /**
   * Store a challenge with TTL
   */
  async set(
    username: string,
    challenge: string,
    ttlSeconds: number = 300
  ): Promise<void> {
    const client = await getRedisClient();
    const key = `auth:challenge:${username.toLowerCase()}`;
    const data = JSON.stringify({
      challenge,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    await client.set(key, data, { EX: ttlSeconds });
  },

  /**
   * Get a challenge (returns null if not found or expired)
   */
  async get(
    username: string
  ): Promise<{ challenge: string; expiresAt: number } | null> {
    const client = await getRedisClient();
    const key = `auth:challenge:${username.toLowerCase()}`;
    const data = await client.get(key);

    if (!data) {
      return null;
    }

    try {
      const parsed = JSON.parse(data);
      // Check if expired (redundant with Redis TTL but extra safety)
      if (parsed.expiresAt < Date.now()) {
        await client.del(key);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  /**
   * Delete a challenge
   */
  async delete(username: string): Promise<void> {
    const client = await getRedisClient();
    const key = `auth:challenge:${username.toLowerCase()}`;
    await client.del(key);
  },
};

export default { getRedisClient, challengeStore };
