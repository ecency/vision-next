import { NextRequest } from "next/server";

/**
 * Resolves the authenticated username from the request.
 *
 * Web clients set the `active_user` cookie during login.
 * Mobile clients send a HiveSigner access token as `code` in the
 * JSON body — validated against HiveSigner's `/api/me` endpoint.
 *
 * Returns the username on success, or null when auth fails.
 *
 * **Important**: because the request body is a ReadableStream that can
 * only be consumed once, the caller must pass the already-parsed body
 * so that subsequent logic can still read it.
 */
export async function resolveUser(
  req: NextRequest,
  body: Record<string, unknown>
): Promise<string | null> {
  // 1. Web path — cookie set by the app on login
  const cookieUser = req.cookies.get("active_user")?.value;
  if (cookieUser) {
    return cookieUser;
  }

  // 2. Mobile path — HiveSigner access token in body
  const code = body.code;
  if (typeof code === "string" && code.length > 0) {
    try {
      const res = await fetch("https://hivesigner.com/api/me", {
        headers: { Authorization: `Bearer ${code}` },
        signal: AbortSignal.timeout(8_000)
      });

      if (!res.ok) {
        console.error(`[3Speak] HiveSigner /api/me failed: ${res.status}`);
        return null;
      }

      const data = await res.json();
      const username = data?.account?.name ?? data?.user;
      return typeof username === "string" ? username : null;
    } catch (e) {
      if (e instanceof DOMException && e.name === "TimeoutError") {
        console.error("[3Speak] HiveSigner token validation timed out");
      } else {
        console.error("[3Speak] HiveSigner token validation error:", e);
      }
      return null;
    }
  }

  return null;
}
