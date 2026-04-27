/**
 * Shared HiveSigner access token verification.
 *
 * Both the Mattermost bootstrap and 3Speak proxy routes authenticate users
 * by validating a HiveSigner OAuth access token against
 * `https://hivesigner.com/api/me`. This module centralizes that logic.
 */

export type HsVerifyResult =
  | { ok: true; username: string }
  | { ok: false; reason: "invalid" | "unavailable" };

export async function verifyHsAccessToken(
  token: string,
  signal?: AbortSignal
): Promise<HsVerifyResult> {
  const timeoutSignal = AbortSignal.timeout(8_000);
  const mergedSignal = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

  let res: Response;
  try {
    res = await fetch("https://hivesigner.com/api/me", {
      headers: { Authorization: `Bearer ${token}` },
      signal: mergedSignal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      console.error("[HiveSigner] /api/me timed out");
    } else if (!signal?.aborted) {
      console.error("[HiveSigner] /api/me network error", e);
    }
    return { ok: false, reason: "unavailable" };
  }

  if (res.status === 401 || res.status === 403) {
    return { ok: false, reason: "invalid" };
  }
  if (!res.ok) {
    console.error(`[HiveSigner] /api/me upstream error ${res.status}`);
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
    console.error("[HiveSigner] /api/me parse error", e);
    return { ok: false, reason: "unavailable" };
  }
}
