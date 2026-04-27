import { NextRequest } from "next/server";
import { verifyHsAccessToken } from "@/server/hivesigner-verify";

export type ResolveUserResult =
  | { ok: true; username: string }
  | { ok: false; reason: "missing" | "invalid" | "unavailable" };

/**
 * Resolves the authenticated username for a 3Speak proxy request.
 *
 * Identity is established by validating a HiveSigner OAuth access token
 * against `https://hivesigner.com/api/me`. The token is supplied via
 * `body.code` (preferred) or the `X-HS-Token` header.
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

  return verifyHsAccessToken(code);
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
