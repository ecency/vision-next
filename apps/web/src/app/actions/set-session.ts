"use server";

import { cookies } from "next/headers";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { createSessionToken } from "@/utils/session";

const SESSION_COOKIE_NAME = "session_token";

/**
 * Server Action to set a cryptographically signed session cookie
 *
 * This creates a secure session that cannot be forged by the client.
 * The session token is signed with HMAC-SHA256 and includes:
 * - Username
 * - Timestamp (for expiration)
 * - Signature (for tamper detection)
 *
 * Security features:
 * - HttpOnly: Cannot be accessed by JavaScript (prevents XSS)
 * - Secure: Only sent over HTTPS in production
 * - SameSite: Prevents CSRF attacks
 * - Signed: Cannot be tampered with
 *
 * @param username - The authenticated username (verified client-side via blockchain keys)
 * @returns Success status
 */
export async function setSessionCookie(username: string | null) {
  const cookieStore = await cookies();

  if (!username) {
    // Clear session cookies on logout
    cookieStore.delete(SESSION_COOKIE_NAME);
    cookieStore.delete(ACTIVE_USER_COOKIE_NAME);
    return { success: true };
  }

  try {
    // Create signed session token
    const sessionToken = createSessionToken(username);

    // Set secure session cookie (HttpOnly, Secure, SameSite)
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60, // 365 days
      path: "/"
    });

    // Also set the legacy cookie for backward compatibility
    // This is NOT trusted for authorization, only for client-side UI state
    cookieStore.set(ACTIVE_USER_COOKIE_NAME, username, {
      httpOnly: false, // Client needs to read this
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60,
      path: "/"
    });

    return { success: true };
  } catch (error) {
    console.error("Error setting session cookie:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set session"
    };
  }
}

/**
 * Server Action to get the current authenticated user from the signed session
 *
 * This verifies the cryptographic signature and returns the username.
 *
 * @returns Username if session is valid, null otherwise
 */
export async function getSessionUser(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const { verifySessionToken } = await import("@/utils/session");
  return verifySessionToken(sessionToken);
}
