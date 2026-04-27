import { NextRequest } from "next/server";

/**
 * Result of validating a HiveSigner OAuth access token against
 * `https://hivesigner.com/api/me`.
 *
 * "invalid" — HS explicitly rejected the token (401/403, malformed payload).
 *             The caller should return 401 so the client can refresh/relog.
 * "unavailable" — HS itself is down/timing out. The caller should return 503
 *                 so a transient outage doesn't force a forced re-login.
 */
export type ResolveUserResult =
  | { ok: true; username: string }
  | { ok: false; reason: "missing" | "invalid" | "unavailable" };

/**
 * Resolves the authenticated username for a 3Speak proxy request.
 *
 * Identity is established by validating a HiveSigner OAuth access token
 * against `https://hivesigner.com/api/me`. The token is supplied via
 * `body.code` (preferred) or the `X-HS-Token` header. We never trust a
 * client-controlled cookie or header for the username itself — only the
 * upstream-validated HiveSigner response.
 *
 * **Important**: because the request body is a ReadableStream that can
 * only be consumed once, the caller must pass the already-parsed body
 * so that subsequent logic can still read it.
 */
export async function resolveUser(
  req: NextRequest,
  body: Record<string, unknown>
): Promise<ResolveUserResult> {
  const headerToken = req.headers.get("x-hs-token");
  const bodyCode = typeof body.code === "string" ? body.code : null;
  const code = bodyCode || headerToken;

  if (!code || code.length === 0) {
    return { ok: false, reason: "missing" };
  }

  let res: Response;
  try {
    res = await fetch("https://hivesigner.com/api/me", {
      headers: { Authorization: `Bearer ${code}` },
      signal: AbortSignal.timeout(8_000)
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      console.error("[3Speak] HiveSigner /api/me timed out");
    } else {
      console.error("[3Speak] HiveSigner /api/me network error", e);
    }
    return { ok: false, reason: "unavailable" };
  }

  if (res.status === 401 || res.status === 403) {
    return { ok: false, reason: "invalid" };
  }
  if (!res.ok) {
    console.error(`[3Speak] HiveSigner /api/me upstream error ${res.status}`);
    return { ok: false, reason: "unavailable" };
  }

  try {
    const data = await res.json();
    const username = data?.account?.name ?? data?.user;
    if (typeof username !== "string") {
      return { ok: false, reason: "invalid" };
    }
    return { ok: true, username };
  } catch (e) {
    console.error("[3Speak] HiveSigner /api/me parse error", e);
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Maps a `ResolveUserResult` failure to an HTTP response. 503 for transient
 * HiveSigner outages so callers retry with backoff instead of mistaking it
 * for an auth failure; 401 only when HS actually rejected the token.
 */
export function unauthorizedResponse(reason: "missing" | "invalid" | "unavailable") {
  if (reason === "unavailable") {
    return Response.json({ error: "Auth service unavailable" }, { status: 503 });
  }
  return Response.json({ error: "Authentication required" }, { status: 401 });
}
