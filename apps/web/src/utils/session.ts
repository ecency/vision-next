import { createHmac, randomBytes } from "crypto";

/**
 * Session token format: username.timestamp.signature
 * The signature is HMAC-SHA256(username + timestamp, SECRET)
 *
 * This provides:
 * - Tamper resistance: Cannot change username without breaking signature
 * - Expiration: Can check timestamp server-side
 * - No database needed: Stateless verification
 */

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
const SESSION_MAX_AGE = 365 * 24 * 60 * 60 * 1000; // 365 days in milliseconds

if (!SESSION_SECRET) {
  console.warn(
    "SESSION_SECRET not set! Session verification will fail. Set SESSION_SECRET or NEXTAUTH_SECRET in environment variables."
  );
}

/**
 * Create a signed session token for a username
 * @param username - The authenticated username
 * @returns Signed token string
 */
export function createSessionToken(username: string): string {
  if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set to create session tokens");
  }

  const timestamp = Date.now().toString();
  const payload = `${username}.${timestamp}`;

  const signature = createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("hex");

  return `${payload}.${signature}`;
}

/**
 * Verify a signed session token and extract the username
 * @param token - The session token to verify
 * @returns Username if valid, null if invalid or expired
 */
export function verifySessionToken(token: string | undefined | null): string | null {
  if (!token || !SESSION_SECRET) {
    return null;
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [username, timestamp, signature] = parts;
    const payload = `${username}.${timestamp}`;

    // Verify signature
    const expectedSignature = createHmac("sha256", SESSION_SECRET)
      .update(payload)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.warn("Invalid session signature detected");
      return null;
    }

    // Check expiration
    const tokenAge = Date.now() - parseInt(timestamp, 10);
    if (tokenAge > SESSION_MAX_AGE) {
      console.warn("Expired session token detected");
      return null;
    }

    return username;
  } catch (error) {
    console.error("Error verifying session token:", error);
    return null;
  }
}

/**
 * Generate a secure random session secret for development
 * In production, set SESSION_SECRET in environment variables
 */
export function generateSessionSecret(): string {
  return randomBytes(32).toString("hex");
}
